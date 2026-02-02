import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { boardgame } = await req.json();
  await connectToDB;
  console.log(boardgame);

  return NextResponse.json({ status: 201 });
}
