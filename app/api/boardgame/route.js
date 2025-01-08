import { NextResponse } from "next/server";
import connectToDB from "@/utils/database";
import Boardgame from "@/models/boardgame";

export const GET = async () => {
  try {
    await connectToDB();
    const boardgames = await Boardgame.find().sort({createdAt:-1}).limit(50);
    return new NextResponse(JSON.stringify(boardgames), { status: 200 });
  } catch (err) {
    return new NextResponse("Error in fetching boardgames " + err, { status: 500 });
  }
};