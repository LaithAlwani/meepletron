import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { boardgame_id, updateData } = await req.json();
  if (!boardgame_id || !updateData)
    return NextResponse.json({ data: `Please add game and file` }, { status: 500 });
  try {
    await connectToDB();
    const doc = await Boardgame.findOneAndUpdate({ _id: boardgame_id }, updateData, { new: true });
    return NextResponse.json({ data: doc, message: `${doc.title} update successfully` } ,{status:201});
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: `Failed to Upload file` }, { status: 500 });
  }
}
