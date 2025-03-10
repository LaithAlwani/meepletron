import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { boardgame_id, is_expansion, updateData } = await req.json();
  if (!boardgame_id || !updateData)
    return NextResponse.json({ data: `Please add game and file` }, { status: 500 });
  try {
    await connectToDB();
    let doc;
    if (is_expansion)
      doc = await Expansion.findByIdAndUpdate({ _id: boardgame_id }, updateData, { new: true });
    else doc = await Boardgame.findByIdAndUpdate({ _id: boardgame_id }, updateData, { new: true });
    //if parent_id is available we record to the expansion collection
    return NextResponse.json(
      { data: doc, message: `${doc.title} update successfully` },
      { status: 201 }
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: `Failed to Upload file` }, { status: 500 });
  }
}
