import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function GET() {
  await connectToDB();
  try {
    const boardgames = await Boardgame.find().sort({createdAt:-1}).limit(10).lean();
    return NextResponse.json({ data: boardgames }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "failed to fetch data" }, { status: 500 });
  }
}
