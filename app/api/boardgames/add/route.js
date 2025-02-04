import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { boardgame, parent_id } = await req.json();
  await connectToDB();
  try {
    const baordgameExsists = await Boardgame.findOne({ bggId: boardgame.bggId });
    if (baordgameExsists) return NextResponse.json({ data: "Boardgame exists" }, { status: 500 });
    const expExists = await Expansion.findOne({ bggId: boardgame.bggId });
    if (expExists) return NextResponse.json({ data: "Expansion exists" }, { status: 500 });

    const doc = parent_id
      ? await Expansion.create({ ...boardgame, parent_id })
      : await Boardgame.create(boardgame);

    return NextResponse.json({ data: doc.title }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ data: "Failed to Add Boardgame" }, { status: 500 });
  }
}
