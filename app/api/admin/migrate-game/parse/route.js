// Resumable, batched rulebook parser.
//
// One HTTP call processes ONE page-range batch and returns progress info.
// The browser drives the loop: discover on cursor=0, batch, batch, ..., last
// batch finalizes (stitches markdown + runs chunker + transitions status to
// "parsed").
//
// Why per-batch routes instead of one long parse: Gemini's inline PDF API
// caps at 20 MB, so a single 50-page rulebook can't go in one shot. Splitting
// on the server side keeps every request small and within Gemini's limits.

// Vercel plan ceiling. Gemini PDF extraction on a dense page-range batch can
// take 30–120 s depending on image content; 300 s gives plenty of headroom.
export const maxDuration = 300;

import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import MigrationDraft from "@/models/migrationDraft";
import connectToDB from "@/utils/database";
import {
  downloadPDF,
  extractMarkdownFromBuffer,
  extractIconTokens,
} from "@/lib/markdown-extractor";
import {
  getPdfMeta,
  extractPageRange,
  planBatches,
} from "@/lib/pdf-splitter";
import { chunkMarkdown } from "@/lib/chunker";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

async function loadGame(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const bg = await Boardgame.findById(id).lean();
  if (bg) return { game: bg, kind: "boardgame" };
  const exp = await Expansion.findById(id).lean();
  if (exp) return { game: exp, kind: "expansion" };
  return null;
}

function pickBatch(plan, cursor) {
  // Pick the batch whose startPage > cursor — i.e. the next pending one.
  // cursor=0 → batch 0. cursor=batch0.endPage → batch 1. etc.
  return plan.find((b) => b.startPage > cursor) || null;
}

function sumUsage(prior, next) {
  if (!next) return prior;
  if (!prior) return { ...next };
  return {
    promptTokens: (prior.promptTokens || 0) + (next.promptTokens || 0),
    completionTokens: (prior.completionTokens || 0) + (next.completionTokens || 0),
    totalTokens: (prior.totalTokens || 0) + (next.totalTokens || 0),
  };
}

function stitchMarkdown(batches) {
  // Concatenate in order. Each batch already has page markers offset to
  // original page numbers, so the result is a single coherent document.
  return batches
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((b) => b.markdown)
    .join("\n\n");
}

function materializeDraftChunks(chunks) {
  return chunks.map((c, i) => ({
    tempId: `c${i.toString().padStart(4, "0")}`,
    breadcrumb: c.breadcrumb || "",
    page: c.page,
    chunkType: c.chunkType,
    scope: c.scope,
    variantName: c.variantName,
    text: c.text,
    originalText: null,
    flags: c.flags || [],
    accepted: true,
    edited: false,
  }));
}

export async function POST(req) {
  const startedAt = Date.now();

  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const cursor = Number(searchParams.get("cursor") || 0);
  if (!id) {
    return NextResponse.json({ message: "id required" }, { status: 400 });
  }
  if (!Number.isFinite(cursor) || cursor < 0) {
    return NextResponse.json({ message: "invalid cursor" }, { status: 400 });
  }

  await connectToDB();
  const loaded = await loadGame(id);
  if (!loaded) {
    return NextResponse.json({ message: "Game not found" }, { status: 404 });
  }
  const { game, kind } = loaded;

  const pdfUrl = game.urls?.find((u) => u?.path)?.path;
  if (!pdfUrl) {
    return NextResponse.json({ message: "No PDF on this game" }, { status: 400 });
  }

  // Download once per request. Vercel functions are stateless so caching
  // between batches would require S3 round-trips anyway. A 25 MB PDF is ~1 s.
  let pdfBuffer;
  try {
    const dl = await downloadPDF(pdfUrl);
    pdfBuffer = dl.buffer;
  } catch (err) {
    console.error("[migrate-game/parse] download failed:", err);
    return NextResponse.json(
      { message: "PDF download failed", error: String(err.message || err) },
      { status: 502 },
    );
  }

  // The plan should already exist (the UI calls parse-discover before the
  // batch loop). If it doesn't — someone bypassed discover, or the draft
  // was wiped — fall back to inline discovery so this route still works
  // standalone. Cursor alone no longer triggers a replan: an existing plan
  // is always preserved so the per-batch loop is idempotent on retry.
  //
  // .lean() is critical here — without it, Mongoose's strict mode silently
  // strips fields that aren't in the cached schema instance (the same
  // HMR/process-singleton footgun the commit route hit). With .lean(), we
  // get the raw POJO straight from MongoDB, so `markdownBatches` and
  // `batchPlan` survive even if a stale model registration exists.
  let draft = await MigrationDraft.findOne({ bg_id: game._id }).lean();
  if (!draft || !draft.batchPlan?.length) {
    let meta;
    try {
      meta = await getPdfMeta(pdfBuffer);
    } catch (err) {
      console.error("[migrate-game/parse] pdf meta failed:", err);
      return NextResponse.json(
        { message: "Couldn't read the PDF — it may be corrupted or password-protected.", error: String(err.message || err) },
        { status: 422 },
      );
    }
    const plan = planBatches({ totalPages: meta.totalPages });
    if (plan.length === 0) {
      return NextResponse.json({ message: "PDF has no pages" }, { status: 422 });
    }
    // strict: false guarantees the new schema fields (batchPlan, totalPages,
    // markdownBatches, iconTokens) are written even if the running process
    // still has a cached MigrationDraft model from before those fields were
    // added. .lean() returns the raw POJO so the readback isn't filtered
    // through that same stale schema.
    draft = await MigrationDraft.findOneAndUpdate(
      { bg_id: game._id },
      {
        $set: {
          bg_id: game._id,
          bg_kind: kind,
          bg_title: game.title,
          pdfUrl,
          status: "parsing",
          totalPages: meta.totalPages,
          batchPlan: plan,
          markdownBatches: [],
          iconTokens: [],
          markdown: "",
          chunks: [],
          removedDuplicates: 0,
          parsedAt: new Date(),
          committedAt: null,
          geminiUsage: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, strict: false },
    ).lean();
  }

  const plan = draft.batchPlan;
  if (!Array.isArray(plan) || plan.length === 0) {
    console.error("[migrate-game/parse] batchPlan missing after upsert", {
      bg_id: game._id.toString(),
      draftKeys: Object.keys(draft || {}),
    });
    return NextResponse.json(
      {
        message:
          "Internal error: batch plan not persisted. This usually means the dev server needs a restart so Mongoose picks up the schema change.",
      },
      { status: 500 },
    );
  }
  const totalBatches = plan.length;
  const totalPages = draft.totalPages;

  const batch = pickBatch(plan, cursor);
  if (!batch) {
    // Nothing pending — either we're already done, or the cursor was bad.
    // Return the existing state so the client can decide what to do.
    return NextResponse.json({
      data: {
        totalPages,
        totalBatches,
        batchIndex: totalBatches,
        endPage: totalPages,
        isComplete: draft.status !== "parsing",
        status: draft.status,
        elapsedMs: Date.now() - startedAt,
      },
    });
  }

  // Slice the PDF down to this batch's pages.
  let slicedBuffer;
  try {
    slicedBuffer = await extractPageRange(pdfBuffer, batch.startPage, batch.endPage);
  } catch (err) {
    console.error("[migrate-game/parse] slicing failed:", err);
    return NextResponse.json(
      { message: "Failed to slice PDF pages", error: String(err.message || err) },
      { status: 500 },
    );
  }

  // Pass already-known tokens to keep batches consistent. First batch has
  // none yet, so this is empty.
  const knownIconTokens = draft.iconTokens || [];

  let extracted;
  try {
    extracted = await extractMarkdownFromBuffer(slicedBuffer, {
      pageNumberOffset: batch.startPage - 1,
      knownIconTokens,
    });
  } catch (err) {
    console.error("[migrate-game/parse] gemini failed:", err);
    return NextResponse.json(
      { message: "Gemini extraction failed", error: String(err.message || err) },
      { status: 502 },
    );
  }

  // Update icon tokens if this batch contributed any new ones (mostly batch 0).
  const newTokens = extractIconTokens(extracted.markdown);
  const mergedTokens = Array.from(new Set([...knownIconTokens, ...newTokens]));

  // Upsert this batch into markdownBatches, replacing any prior entry at the
  // same index (idempotent — caller can retry a failed batch).
  const existingBatches = (draft.markdownBatches || []).filter((b) => b.index !== batch.index);
  const updatedBatches = [
    ...existingBatches,
    {
      index: batch.index,
      startPage: batch.startPage,
      endPage: batch.endPage,
      markdown: extracted.markdown,
    },
  ];
  const updatedUsage = sumUsage(draft.geminiUsage, extracted.usage);

  const isLastBatch = batch.index === totalBatches - 1;

  const update = {
    markdownBatches: updatedBatches,
    iconTokens: mergedTokens,
    geminiUsage: updatedUsage,
  };

  if (isLastBatch) {
    // Stitch + chunk + finalize. The chunker doesn't care which batches
    // produced which sections — it operates on the final string.
    const stitched = stitchMarkdown(updatedBatches);
    let chunkResult;
    try {
      chunkResult = await chunkMarkdown(stitched);
    } catch (err) {
      console.error("[migrate-game/parse] chunker failed:", err);
      return NextResponse.json(
        { message: "Chunking failed", error: String(err.message || err) },
        { status: 500 },
      );
    }
    update.markdown = stitched;
    update.chunks = materializeDraftChunks(chunkResult.chunks);
    update.removedDuplicates = chunkResult.removedDuplicates;
    update.status = "parsed";
    update.parsedAt = new Date();
  }

  await MigrationDraft.findOneAndUpdate(
    { bg_id: game._id },
    { $set: update },
    { strict: false },
  );

  return NextResponse.json({
    data: {
      totalPages,
      totalBatches,
      batchIndex: batch.index,
      endPage: batch.endPage,
      startPage: batch.startPage,
      isComplete: isLastBatch,
      status: isLastBatch ? "parsed" : "parsing",
      elapsedMs: Date.now() - startedAt,
    },
  });
}
