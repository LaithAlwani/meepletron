import { NextResponse } from "next/server";
import connectToDB from "@/utils/database";
import Boardgame from "@/models/boardgame";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.searchParams);
    const query = searchParams.get("query");
    let limit = parseInt(searchParams.get("limit"), 10); // Convert to number

    if (!query) {
      return NextResponse.json({ message: "Query parameter is required" }, { status: 400 });
    }

    await connectToDB();

    const normalizeText = (text) =>
      text
        .normalize("NFD") // Decomposes accents
        .replace(/[\u0300-\u036f]/g, "") // Removes diacritics
        .toLowerCase();

    const normalizedQuery = normalizeText(query);
    const searchWords = normalizedQuery.split(/\s+/).filter(Boolean);

    if (!searchWords.length) {
      return NextResponse.json({ message: "Invalid search query" }, { status: 400 });
    }

    // Create an array of regex conditions for each search word
    const regexConditions = searchWords.map((word) => ({
      title: { $regex: word, $options: "i" }, // Case-insensitive search
    }));
    let boardgames;

    boardgames = await Boardgame.find(
      { $and: regexConditions }, // Ensures all words appear somewhere in the title
      { title: 1, thumbnail: 1, urls: 1, isExpansion: 1, parent_id: 1 }
    )
      .limit(limit)
      .lean();

    if (boardgames.length === 0) {
      let dbQuery = Boardgame.aggregate([
        {
          $search: {
            index: "title_designer", // Your Atlas Search index name
            text: {
              query: query,
              path: ["title","designers" ,"publishers"],
              fuzzy: {
                maxEdits: 2, // Allows up to 2 typo corrections
              }
            }
          }
        },
        {
          $project: {
            title: 1,
            image:1,
            thumbnail: 1,
            urls: 1,
            is_expansion: 1,
            parent_id: 1,
            description: 1,
            designers: 1,
            score: { $meta: "searchScore" },
          }
        },
        { $sort: { score: -1 } }
      ]);
      if (!isNaN(limit) && limit > 0) {
        dbQuery = dbQuery.limit(limit);
      }
      boardgames = await dbQuery.exec(); // Use `.exec()` for consistency
    }

    return NextResponse.json({ data: boardgames }, { status: 200 });
  } catch (error) {
    console.error("Error fetching board games:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
