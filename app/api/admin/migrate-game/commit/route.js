// Commits a reviewed MigrationDraft to Pinecone v2 index. Embeds the accepted
// chunks with text-embedding-3-small, upserts vectors, deletes any prior v2
// vectors for this game (so re-runs are clean), and sets `embed_version = 2`
// on the Boardgame/Expansion.

import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import MigrationDraft from "@/models/migrationDraft";
import connectToDB from "@/utils/database";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

const V2_INDEX = process.env.PINECONE_INDEX_NAME_V2;
const V2_VECTOR_DIM = 1536;
const PINECONE_PURGE_TOPK = 1000;

// Pinecone metadata values must be string, number, boolean, or string[].
// Drop any null/undefined keys so they're omitted rather than rejected.
function stripNulls(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    out[key] = value;
  }
  return out;
}

export async function POST(req) {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (!V2_INDEX) {
    return NextResponse.json(
      { message: "PINECONE_INDEX_NAME_V2 not configured" },
      { status: 500 }
    );
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  await connectToDB();
  const draft = await MigrationDraft.findOne({ bg_id: id });
  if (!draft) return NextResponse.json({ message: "No draft" }, { status: 404 });

  const accepted = draft.chunks.filter((c) => c.accepted);
  if (accepted.length === 0) {
    return NextResponse.json(
      { message: "No chunks accepted — accept at least one before committing." },
      { status: 400 }
    );
  }

  // Resolve the canonical game record for metadata (title, parent_id, bgg_id…).
  const Model = draft.bg_kind === "expansion" ? Expansion : Boardgame;
  const game = await Model.findById(draft.bg_id).lean();
  if (!game) return NextResponse.json({ message: "Game not found" }, { status: 404 });

  // Embed accepted chunks.
  const embedder = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
  let vectors;
  try {
    const inputs = accepted.map((c) => c.text);
    const embeddings = await embedder.embedDocuments(inputs);
    vectors = accepted.map((c, i) => ({
      id: `${draft.bg_id.toString()}-${c.tempId}`,
      values: embeddings[i],
      metadata: stripNulls({
        bg_id: draft.bg_id.toString(),
        parent_id: game.parent_id ? game.parent_id.toString() : null,
        bg_title: game.title,
        bg_refrence_url: draft.pdfUrl,
        breadcrumb: c.breadcrumb || "",
        page: c.page, // can be null — strip below
        chunkType: c.chunkType || "text",
        scope: c.scope || "main",
        variantName: c.variantName, // can be null — strip below
        text: c.text,
      }),
    }));
  } catch (err) {
    console.error("[migrate-game/commit] embedding failed:", err);
    return NextResponse.json(
      { message: "Embedding failed", error: String(err) },
      { status: 502 }
    );
  }

  // Pinecone: purge any prior v2 vectors for this game, then upsert.
  const pinecone = new Pinecone();
  const index = pinecone.index(V2_INDEX);

  try {
    const existing = await index.query({
      vector: new Array(V2_VECTOR_DIM).fill(0),
      topK: PINECONE_PURGE_TOPK,
      includeMetadata: false,
      includeValues: false,
      filter: { bg_id: draft.bg_id.toString() },
    });
    if (existing.matches.length > 0) {
      await index.deleteMany(existing.matches.map((m) => m.id));
    }

    // Upsert in batches of 100 (Pinecone's recommended batch size).
    const BATCH = 100;
    for (let i = 0; i < vectors.length; i += BATCH) {
      await index.upsert(vectors.slice(i, i + BATCH));
    }
  } catch (err) {
    console.error("[migrate-game/commit] Pinecone write failed:", err);
    return NextResponse.json(
      { message: "Pinecone write failed", error: String(err) },
      { status: 502 }
    );
  }

  // Flip the game to v2 — capture the result so a silent no-op (id mismatch,
  // wrong model branch, or Mongoose strict-mode dropping the field on a stale
  // cached model) can't slip through as a misleading 200.
  //
  // strict: false guarantees the field is written even if a stale HMR-cached
  // model instance was built before `embed_version` existed on the schema;
  // .lean() returns the raw POJO from MongoDB so the readback isn't filtered
  // through that same cached schema.
  const updated = await Model.findByIdAndUpdate(
    draft.bg_id,
    { $set: { embed_version: 2 } },
    { new: true, strict: false },
  ).lean();
  if (!updated || updated.embed_version !== 2) {
    console.error("[migrate-game/commit] flag flip failed", {
      bg_id: draft.bg_id.toString(),
      bg_kind: draft.bg_kind,
      updatedDocPresent: !!updated,
      embedVersionAfter: updated?.embed_version,
    });
    return NextResponse.json(
      {
        message:
          "Vectors committed but failed to mark game as v2. Re-run commit or update embed_version manually.",
      },
      { status: 500 },
    );
  }

  draft.status = "committed";
  draft.committedAt = new Date();
  await draft.save();

  return NextResponse.json({
    data: {
      committed: vectors.length,
      rejected: draft.chunks.length - accepted.length,
      bg_id: draft.bg_id.toString(),
      embed_version: 2,
    },
  });
}
