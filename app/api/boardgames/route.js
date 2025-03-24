import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  await connectToDB();
  try {
    const boardgames = await Boardgame.find()
      .where({ is_expansion: false })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    if (boardgames.length === 0)
      return NextResponse.json({ data: [], message: "Board Games not Found" }, { status: 404 });
    const totalGames = await Boardgame.countDocuments();
    
    return NextResponse.json(
      { data: { boardgames, totalGames }, message: "success" },
      { status: 200 }
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "failed to fetch data" }, { status: 500 });
  }
}
