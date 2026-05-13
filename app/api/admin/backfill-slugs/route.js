// One-time backfill: assigns a slug to every Boardgame and Expansion that doesn't have one.
// Idempotent — running it again is a no-op since docs with slugs are skipped.
//
// Usage (admin only):
//   GET  /api/admin/backfill-slugs   — easy run from the browser address bar
//   POST /api/admin/backfill-slugs   — programmatic / fetch
//
// Both verbs do the same thing; we permit GET because this endpoint is admin-gated
// and idempotent, so visiting it in a browser is the simplest UX.

import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { uniqueSlug } from "@/utils/slugify";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

async function runBackfill() {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDB();

    const results = { boardgames: { updated: 0, skipped: 0 }, expansions: { updated: 0, skipped: 0 } };

    const games = await Boardgame.find({ $or: [{ slug: null }, { slug: { $exists: false } }, { slug: "" }] });
    for (const game of games) {
      if (game.slug) { results.boardgames.skipped++; continue; }
      game.slug = await uniqueSlug(Boardgame, game.title, game._id);
      await game.save();
      results.boardgames.updated++;
    }

    const expansions = await Expansion.find({ $or: [{ slug: null }, { slug: { $exists: false } }, { slug: "" }] });
    for (const exp of expansions) {
      if (exp.slug) { results.expansions.skipped++; continue; }
      exp.slug = await uniqueSlug(Expansion, exp.title, exp._id);
      await exp.save();
      results.expansions.updated++;
    }

    return NextResponse.json({ data: results });
  } catch (err) {
    console.error("[backfill-slugs] error:", err);
    return NextResponse.json({ message: err.message || "Backfill failed" }, { status: 500 });
  }
}

export const GET = runBackfill;
export const POST = runBackfill;
