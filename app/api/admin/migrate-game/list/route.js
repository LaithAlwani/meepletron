// Lists all boardgames + expansions with their migration status, for the
// admin migration tab. Joins each row with its MigrationDraft (if any) so
// the UI can show "Review draft" / "Start migration" / "Migrated".

import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import MigrationDraft from "@/models/migrationDraft";
import connectToDB from "@/utils/database";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const DEFAULT_LIMIT = 50;

export async function GET(req) {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10)));
  const filter = searchParams.get("filter") || "pending"; // "pending" | "migrated" | "all"
  const kind = searchParams.get("kind") || "all"; // "boardgame" | "expansion" | "all"
  const q = (searchParams.get("q") || "").trim();

  await connectToDB();

  const baseQuery = {};
  if (filter === "pending") baseQuery.embed_version = { $ne: 2 };
  if (filter === "migrated") baseQuery.embed_version = 2;
  if (q) baseQuery.title = { $regex: q, $options: "i" };

  const projection = "title slug thumbnail urls embed_version parent_id is_expansion createdAt";

  const [boardgames, expansions, totalBoardgames, totalExpansions] = await Promise.all([
    kind === "expansion" ? [] : Boardgame.find(baseQuery, projection).sort({ title: 1 }).lean(),
    kind === "boardgame" ? [] : Expansion.find(baseQuery, projection).sort({ title: 1 }).lean(),
    kind === "expansion" ? 0 : Boardgame.countDocuments(baseQuery),
    kind === "boardgame" ? 0 : Expansion.countDocuments(baseQuery),
  ]);

  const games = [
    ...boardgames.map((g) => ({ ...g, bg_kind: "boardgame" })),
    ...expansions.map((g) => ({ ...g, bg_kind: "expansion" })),
  ].sort((a, b) => a.title.localeCompare(b.title));

  const total = totalBoardgames + totalExpansions;
  const skip = (page - 1) * limit;
  const paged = games.slice(skip, skip + limit);

  // Join drafts for the visible page only
  const ids = paged.map((g) => g._id);
  const drafts = await MigrationDraft.find(
    { bg_id: { $in: ids } },
    "bg_id status chunks.length removedDuplicates parsedAt committedAt"
  ).lean();
  const draftByGame = new Map(drafts.map((d) => [d.bg_id.toString(), d]));

  const data = paged.map((g) => {
    const draft = draftByGame.get(g._id.toString());
    const hasPdf = Array.isArray(g.urls) && g.urls.some((u) => u?.path);
    return {
      _id: g._id,
      title: g.title,
      slug: g.slug,
      thumbnail: g.thumbnail,
      bg_kind: g.bg_kind,
      parent_id: g.parent_id || null,
      embed_version: g.embed_version || 1,
      has_pdf: hasPdf,
      draft_status: draft?.status || null,
      draft_chunk_count: draft?.chunks?.length || 0,
      draft_parsed_at: draft?.parsedAt || null,
      draft_committed_at: draft?.committedAt || null,
    };
  });

  return NextResponse.json({
    data,
    page,
    limit,
    total,
    hasMore: skip + paged.length < total,
  });
}
