import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function GET(req) {
  const url = new URL(req.url);
  const searchParamas = new URLSearchParams(url.searchParams);
  const limit = parseInt(searchParamas.get("limit")) || 25;
  
  await connectToDB();
  try {
    const boardgames = await Boardgame.find()
      .where({ is_expansion: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    if (boardgames.length === 0)
      return NextResponse.json({ data: [], message: "Board Games not Found" }, { status: 404 });
    
    return NextResponse.json({ data: boardgames, message:"success" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "failed to fetch data" }, { status: 500 });
  }
}
