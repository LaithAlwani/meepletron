import { NextResponse } from "next/server";
import connectToDB from "@/utils/database";
import Boardgame from "@/models/boardgame";

export async function GET(req) {
  const url = new URL(req.url);
  const searchParams = new URLSearchParams(url.searchParams);
  const query = searchParams.get("query");
  const limit = searchParams.get("limit");

  if (!query) {
    return res.status(400).json({ message: "Query parameter is required" });
  }
  try {
    await connectToDB();
    const searchWords = query.split(" ").filter((word) => word.trim() !== "");
    const searchRegex = searchWords.map((word) => `(?=.*${word})`).join("");
    let dbQuery = Boardgame.find(
      { title: { $regex: searchRegex, $options: "i" } }, // Case-insensitive regex search
      { title: 1, thumbnail: 1, urls: 1, isExpansion: 1, parent_id: 1 } // Return only title and description
    );

    if (limit !== "undefined" && limit !== "null") {   
      dbQuery = dbQuery.limit(limit);
    }
    const boardgames = await dbQuery.lean();
    return NextResponse.json({ data: boardgames }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
