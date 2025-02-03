import { NextResponse } from "next/server";
import connectToDB from "@/utils/database";
import Boardgame from "@/models/boardgame";

export async function GET(req) {
  const url = new URL(req.url);
  const searchParams = new URLSearchParams(url.searchParams);
  const query = searchParams.get("query");

  if (!query) {
    return res.status(400).json({ message: "Query parameter is required" });
  }

  try {
    await connectToDB();

    const boardgames = await Boardgame.find(
      { title: { $regex: query, $options: "i" } }, // Case-insensitive regex search
      { title: 1, thumbnail:1 } // Return only title and description
    )
      .limit(5) // Limit to 10 boardgames
      .exec();
  
    return NextResponse.json({ data: boardgames }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
