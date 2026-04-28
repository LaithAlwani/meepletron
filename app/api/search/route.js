import { NextResponse } from "next/server";
import connectToDB from "@/utils/database";
import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";

export async function GET(req) {
  const url = new URL(req.url);
  const params = new URLSearchParams(url.searchParams);
  const query = params.get("query")?.trim();
  const limit = parseInt(params.get("limit"), 10) || 10;
  const includeExpansions = params.get("includeExpansions") === "true";

  if (!query) {
    return NextResponse.json({ message: "Query parameter is required" }, { status: 400 });
  }

  await connectToDB();

  // Atlas Search — better fuzzy/relevance matching
  try {
    const atlasStages = (indexName) => [
      {
        $search: {
          index: indexName,
          text: {
            query,
            path: ["title", "designers", "publishers"],
            fuzzy: { maxEdits: 1 },
          },
        },
      },
      {
        $project: {
          title: 1,
          thumbnail: 1,
          image: 1,
          urls: 1,
          is_expansion: 1,
          parent_id: 1,
          bgg_id: 1,
          score: { $meta: "searchScore" },
        },
      },
      { $limit: limit },
    ];

    const [boardgames, expansions] = await Promise.all([
      Boardgame.aggregate(atlasStages("title_designer")).exec(),
      includeExpansions
        ? Expansion.aggregate(atlasStages("expansion-search")).exec()
        : Promise.resolve([]),
    ]);

    // Only trust Atlas results if base games are present — if Atlas returned
    // expansions but 0 base games, the boardgames index may be misconfigured
    // in this environment; fall through to regex so base games aren't lost.
    if (boardgames.length > 0) {
      const combined = [...boardgames, ...expansions].sort(
        (a, b) => (b.score ?? 0) - (a.score ?? 0)
      );
      return NextResponse.json(combined, { status: 200 });
    }
  } catch (_) {
    // Atlas Search unavailable — fall through to regex
  }

  // Regex fallback — guaranteed to work as long as DB is reachable
  const words = query.split(/\s+/).filter(Boolean);
  const regexConditions = words.map((w) => ({ title: { $regex: w, $options: "i" } }));
  const fields = { title: 1, thumbnail: 1, image: 1, urls: 1, is_expansion: 1, parent_id: 1, bgg_id: 1 };

  const [boardgames, expansions] = await Promise.all([
    Boardgame.find({ $and: regexConditions }, fields).limit(limit).lean(),
    includeExpansions
      ? Expansion.find({ $and: regexConditions }, fields).limit(limit).lean()
      : Promise.resolve([]),
  ]);

  return NextResponse.json([...boardgames, ...expansions], { status: 200 });
}
