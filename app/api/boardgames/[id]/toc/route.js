// Returns the rulebook table-of-contents for a game's v2 chunks.
// Used by the SourcePanel to render a browsable rulebook index.
//
// Only available for games at embed_version === 2 (the new semantic pipeline).
// Returns 404 for v1 games so the SourcePanel can hide itself gracefully.

import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { Pinecone } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

const V2_INDEX = process.env.PINECONE_INDEX_NAME_V2;
const V2_VECTOR_DIM = 1536;
const FETCH_TOPK = 1000; // covers any realistic rulebook

async function resolveGame(idOrSlug) {
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
  return game;
}

export async function GET(_req, { params }) {
  if (!V2_INDEX) {
    return NextResponse.json({ message: "v2 index not configured" }, { status: 503 });
  }

  const { id } = await params;
  const game = await resolveGame(id);
  if (!game) return NextResponse.json({ message: "Game not found" }, { status: 404 });

  if ((game.embed_version || 1) !== 2) {
    // Game still on the legacy pipeline — no breadcrumb metadata to render.
    return NextResponse.json({ message: "Game not yet migrated to v2" }, { status: 404 });
  }

  const pinecone = new Pinecone();
  const index = pinecone.index(V2_INDEX);

  const response = await index.query({
    vector: new Array(V2_VECTOR_DIM).fill(0),
    topK: FETCH_TOPK,
    includeMetadata: true,
    includeValues: false,
    filter: { bg_id: game._id.toString() },
  });

  // Sort by page (nulls last) then by chunk id (which embeds the original order)
  const chunks = response.matches
    .map((m) => ({
      chunkId: m.id,
      bg_id: m.metadata.bg_id,
      bg_title: m.metadata.bg_title || game.title,
      breadcrumb: m.metadata.breadcrumb || "",
      page: typeof m.metadata.page === "number" ? m.metadata.page : null,
      chunkType: m.metadata.chunkType || "text",
      scope: m.metadata.scope || "main",
      variantName: m.metadata.variantName || null,
      preview: (m.metadata.text || "").slice(0, 160),
      text: m.metadata.text || "",
    }))
    .sort((a, b) => {
      const pa = a.page ?? Number.MAX_SAFE_INTEGER;
      const pb = b.page ?? Number.MAX_SAFE_INTEGER;
      if (pa !== pb) return pa - pb;
      return a.chunkId.localeCompare(b.chunkId);
    });

  return NextResponse.json({
    data: {
      game: { _id: game._id, title: game.title, slug: game.slug },
      chunks,
    },
  });
}
