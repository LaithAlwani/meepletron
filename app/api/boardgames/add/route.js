import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { boardgame } = await req.json();
  await connectToDB();

  try {
    const boardgameExist = await Boardgame.findOne({ bggId: boardgame.bggId });
    if (boardgameExist) return NextResponse.json({ data: "Boardgame exists" }, { status: 500 });
    let parentDoc;
    let doc;
    if (boardgame.isExpansion) {
      parentDoc = await Boardgame.findOne({ bggId: boardgame.parent_bgg_Id });
      console.log("parent ", parentDoc)
      doc = await Boardgame.create({
        ...boardgame,
        parent_bgg_id: parentDoc?.bggId,
        parent_id: parentDoc._id,
      });
    } else {
      console.log("else")
      doc = await Boardgame.create(boardgame);
    }

    return NextResponse.json({ data: doc.title }, { status: 201 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ data: "Failed to Add Boardgame" }, { status: 500 });
  }
}
