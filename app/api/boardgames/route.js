import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { boardgame, parent_id } = await req.json();

  if (!boardgame) {
    return NextResponse.json({ success: false });
  }
  try {
    await connectToDB();
    let doc;
    if (parent_id) {
      doc = await Expansion.create({ ...boardgame, parent_id });
    } else {
      doc = await Boardgame.create(boardgame);
    }

    return NextResponse.json({ data: doc.title, message: "Data Embedded" }, { status: 201 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to create boardgame" }, { status: 500 });
  }
}
