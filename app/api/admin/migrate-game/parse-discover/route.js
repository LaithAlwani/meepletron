// One-shot setup for a batched rulebook parse:
//   1. download the PDF
//   2. read its page count via pdf-lib
//   3. compute a fixed-page batch plan
//   4. upsert a fresh MigrationDraft with status="parsing" and the plan
//
// NO Gemini call here. This is the "everything that happens before the first
// Gemini batch" step, broken out so the per-batch timings users see start
// from the actual Gemini work (download + slice + extract) rather than
// double-counting one-time setup.

// Vercel function ceiling. The work here is fast (download + pdf-lib meta),
// but huge PDFs over slow S3 connections can still spike — 300 s matches
// the parse route so a misconfigured deploy can't catch us out here.
export const maxDuration = 300;

import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import MigrationDraft from "@/models/migrationDraft";
import connectToDB from "@/utils/database";
import { downloadPDF } from "@/lib/markdown-extractor";
import { getPdfMeta, planBatches } from "@/lib/pdf-splitter";
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

export async function POST(req) {
  const startedAt = Date.now();

  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ message: "id required" }, { status: 400 });

  await connectToDB();
  const loaded = await loadGame(id);
  if (!loaded) return NextResponse.json({ message: "Game not found" }, { status: 404 });
  const { game, kind } = loaded;

  const pdfUrl = game.urls?.find((u) => u?.path)?.path;
  if (!pdfUrl) return NextResponse.json({ message: "No PDF on this game" }, { status: 400 });

  let buffer;
  try {
    const dl = await downloadPDF(pdfUrl);
    buffer = dl.buffer;
  } catch (err) {
    console.error("[migrate-game/parse-discover] download failed:", err);
    return NextResponse.json(
      { message: "PDF download failed", error: String(err.message || err) },
      { status: 502 },
    );
  }

  let meta;
  try {
    meta = await getPdfMeta(buffer);
  } catch (err) {
    console.error("[migrate-game/parse-discover] pdf meta failed:", err);
    return NextResponse.json(
      {
        message:
          "Couldn't read the PDF — it may be corrupted or password-protected.",
        error: String(err.message || err),
      },
      { status: 422 },
    );
  }

  const plan = planBatches({ totalPages: meta.totalPages });
  if (plan.length === 0) {
    return NextResponse.json({ message: "PDF has no pages" }, { status: 422 });
  }

  // strict: false: same Mongoose stale-schema dance as the rest of the
  // migration flow — guarantees the new fields (batchPlan, totalPages,
  // markdownBatches, iconTokens) land on disk even if the running process
  // cached the model before they existed.
  await MigrationDraft.findOneAndUpdate(
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
  );

  return NextResponse.json({
    data: {
      totalPages: meta.totalPages,
      totalBatches: plan.length,
      batchPlan: plan,
      elapsedMs: Date.now() - startedAt,
    },
  });
}
