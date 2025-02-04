import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { boardgame_id, blob } = await req.json();
  if (!boardgame_id || !blob)
    return NextResponse.json({ data: `Please add game and file` }, { status: 500 });
  const url = {
    blob, 
    isTextExtracted:false
  }
  try {
    await connectToDB();
    let doc;
    doc = await Boardgame.findOneAndUpdate({ _id: boardgame_id }, { $push: { urls: url } });
    if (!doc) doc = await Expansion.findOneAndUpdate({ _id: boardgame_id }, { $push: { urls: url } });
    
    return NextResponse.json({ data: `${doc.title} update successfully` });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ data: `Failed to Upload file` }, { status: 500 });
  }
}
