// Read, auto-save updates, or discard a MigrationDraft.
//
//   GET    /api/admin/migrate-game/draft?id=<gameId>
//          → returns the draft for the game (or 404)
//
//   PATCH  /api/admin/migrate-game/draft?id=<gameId>
//          body: { chunkUpdates: [{ tempId, text?, accepted? }] }
//          → applies per-chunk edits (debounced auto-save from the review UI)
//
//   DELETE /api/admin/migrate-game/draft?id=<gameId>
//          → removes the draft, no Pinecone changes

import MigrationDraft from "@/models/migrationDraft";
import connectToDB from "@/utils/database";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

async function adminGuard() {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return null;
}

function badId(id) {
  return !id || !mongoose.isValidObjectId(id);
}

export async function GET(req) {
  const forbidden = await adminGuard();
  if (forbidden) return forbidden;

  const id = new URL(req.url).searchParams.get("id");
  if (badId(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  await connectToDB();
  const draft = await MigrationDraft.findOne({ bg_id: id }).lean();
  if (!draft) return NextResponse.json({ message: "No draft" }, { status: 404 });
  return NextResponse.json({ data: draft });
}

export async function PATCH(req) {
  const forbidden = await adminGuard();
  if (forbidden) return forbidden;

  const id = new URL(req.url).searchParams.get("id");
  if (badId(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const updates = Array.isArray(body?.chunkUpdates) ? body.chunkUpdates : null;
  if (!updates) {
    return NextResponse.json({ message: "chunkUpdates array required" }, { status: 400 });
  }

  await connectToDB();
  const draft = await MigrationDraft.findOne({ bg_id: id });
  if (!draft) return NextResponse.json({ message: "No draft" }, { status: 404 });
  if (draft.status === "committed") {
    return NextResponse.json(
      { message: "Draft already committed; reparse to edit" },
      { status: 409 }
    );
  }

  const updateByTempId = new Map(updates.map((u) => [u.tempId, u]));
  let anyChange = false;
  for (const chunk of draft.chunks) {
    const u = updateByTempId.get(chunk.tempId);
    if (!u) continue;

    if (typeof u.text === "string" && u.text !== chunk.text) {
      if (!chunk.edited) chunk.originalText = chunk.text;
      chunk.text = u.text;
      chunk.edited = true;
      anyChange = true;
    }
    if (typeof u.accepted === "boolean" && u.accepted !== chunk.accepted) {
      chunk.accepted = u.accepted;
      anyChange = true;
    }
  }

  if (anyChange) {
    draft.status = "reviewing";
    draft.markModified("chunks");
    await draft.save();
  }

  return NextResponse.json({
    data: { status: draft.status, applied: anyChange ? updates.length : 0 },
  });
}

export async function DELETE(req) {
  const forbidden = await adminGuard();
  if (forbidden) return forbidden;

  const id = new URL(req.url).searchParams.get("id");
  if (badId(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  await connectToDB();
  const result = await MigrationDraft.deleteOne({ bg_id: id });
  return NextResponse.json({ data: { deleted: result.deletedCount } });
}
