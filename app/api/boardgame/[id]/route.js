import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function GET(req, context) {
  const { params } = context;
  const id = params.id;
  try {
    await connectToDB();
    const boardgame = await Boardgame.findOne({ _id: id });
    return NextResponse.json(boardgame, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Error in fetching boardgame" + err }, { status: 500 });
  }
}
