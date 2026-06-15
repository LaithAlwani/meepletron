import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const players = searchParams.get("players");
  const time = searchParams.get("time");
  const hasExpansions = searchParams.get("hasExpansions") === "true";
  const hasRulebook = searchParams.get("hasRulebook") === "true";

  const filter = { is_expansion: { $ne: true } };

  if (players) {
    const n = parseInt(players);
    if (!isNaN(n)) {
      if (n >= 6) {
        filter.max_players = { $gte: 6 };
      } else {
        filter.min_players = { $lte: n };
        filter.max_players = { $gte: n };
      }
    }
  }

  if (time === "quick") filter.play_time = { $lte: 30 };
  else if (time === "standard") filter.play_time = { $gt: 30, $lte: 90 };
  else if (time === "epic") filter.play_time = { $gt: 90 };

  if (hasExpansions) filter["expansions.0"] = { $exists: true };
  if (hasRulebook) filter["urls.0"] = { $exists: true };

  await connectToDB();
  try {
    const [boardgames, totalGames] = await Promise.all([
      Boardgame.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Boardgame.countDocuments(filter),
    ]);

    // Cache the paginated list at the CDN edge. Vercel keys the cache on the
    // full URL (incl. query string), so each page/filter combo caches separately.
    return NextResponse.json(
      { data: { boardgames, totalGames } },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "failed to fetch data" }, { status: 500 });
  }
}
