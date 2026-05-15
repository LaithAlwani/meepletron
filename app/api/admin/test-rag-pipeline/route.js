// One-off test harness for the new RAG pipeline (Stages 1 + 2).
// Admin-only. Runs the markdown extractor + chunker against a real rulebook
// and returns the result as JSON so you can eyeball it in the browser.
//
// Usage examples (signed in as admin):
//   GET /api/admin/test-rag-pipeline?gameId=catan
//   GET /api/admin/test-rag-pipeline?gameId=<24-char-objectid>
//   GET /api/admin/test-rag-pipeline?url=https://meepletron-storage.s3.../rulebook.pdf
//   GET /api/admin/test-rag-pipeline?gameId=catan&format=raw   // returns markdown text, not JSON

import mongoose from "mongoose";
import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { extractMarkdownFromPDF } from "@/lib/markdown-extractor";
import { chunkMarkdown } from "@/lib/chunker";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


async function resolveUrl(idOrSlug) {
  await connectToDB();

  let game = null;
  if (mongoose.isValidObjectId(idOrSlug)) {
    game = await Boardgame.findById(idOrSlug).lean();
    if (!game) game = await Expansion.findById(idOrSlug).lean();
  }
  if (!game) {
    game = await Boardgame.findOne({ slug: idOrSlug }).lean();
    if (!game) game = await Expansion.findOne({ slug: idOrSlug }).lean();
  }
  if (!game) return null;

  const url = game.urls?.[0]?.path;
  return { title: game.title, url };
}

export async function GET(req) {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");
  const directUrl = searchParams.get("url");
  const format = searchParams.get("format") || "json"; // "json" | "raw"

  let title = null;
  let pdfUrl = directUrl;

  if (!pdfUrl && gameId) {
    const resolved = await resolveUrl(gameId);
    if (!resolved) return NextResponse.json({ message: "Game not found" }, { status: 404 });
    title = resolved.title;
    pdfUrl = resolved.url;
  }

  if (!pdfUrl) {
    return NextResponse.json(
      { message: "Provide ?gameId=<slug or id> or ?url=<pdf url>" },
      { status: 400 }
    );
  }

  const timings = {};
  const t0 = Date.now();
  let markdown;
  let usage;
  try {
    const result = await extractMarkdownFromPDF(pdfUrl);
    markdown = result.markdown;
    usage = result.usage;
    timings.extractMs = Date.now() - t0;
  } catch (err) {
    return NextResponse.json(
      { message: "Extraction failed", error: String(err) },
      { status: 500 }
    );
  }

  // If user asked for raw markdown, dump it as text/plain
  if (format === "raw") {
    return new NextResponse(markdown, {
      status: 200,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  const t1 = Date.now();
  let chunks;
  let removedDuplicates = 0;
  try {
    const result = await chunkMarkdown(markdown);
    chunks = result.chunks;
    removedDuplicates = result.removedDuplicates;
    timings.chunkMs = Date.now() - t1;
  } catch (err) {
    return NextResponse.json(
      { message: "Chunking failed", error: String(err), markdownPreview: markdown.slice(0, 1000) },
      { status: 500 }
    );
  }

  // Build a useful summary plus the chunks
  const summary = {
    title,
    pdfUrl,
    markdownLength: markdown.length,
    chunkCount: chunks.length,
    removedDuplicates,
    byType: countBy(chunks, (c) => c.chunkType),
    byScope: countBy(chunks, (c) => c.scope),
    variantNames: [...new Set(chunks.filter((c) => c.variantName).map((c) => c.variantName))],
    flaggedCount: chunks.filter((c) => c.flags.length > 0).length,
    flagCounts: countFlags(chunks),
    legend: chunks.find((c) => c.chunkType === "legend") ?? null,
    pagesSeen: [...new Set(chunks.map((c) => c.page).filter((p) => p != null))].sort((a, b) => a - b),
    timings,
    geminiUsage: usage,
  };

  return NextResponse.json({
    summary,
    chunks: chunks.map((c) => ({
      breadcrumb: c.breadcrumb,
      page: c.page,
      chunkType: c.chunkType,
      scope: c.scope,
      variantName: c.variantName,
      flags: c.flags,
      textPreview: c.text.slice(0, 240),
      textLength: c.text.length,
    })),
  });
}

function countBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = keyFn(item) ?? "(none)";
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function countFlags(chunks) {
  const out = {};
  for (const chunk of chunks) {
    for (const flag of chunk.flags) {
      out[flag] = (out[flag] || 0) + 1;
    }
  }
  return out;
}
