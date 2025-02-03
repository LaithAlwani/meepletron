import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";
export async function GET(req, { params }) {
  const { id } = await params;
  try {
    await connectToDB();

    const boardgame = await Boardgame.findOne({ _id: id });
    let expansions;
    if (boardgame) {
      expansions = await Expansion.find({ parent_id: id }, { thumbnail: 1, title: 1 });
    } else {
      console.log("fetching")
      expansions = await Expansion.findOne({ _id: id });
      console.log(expansions)
    }
    const data = boardgame ? { boardgame, expansions } : expansions;
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Error in fetching boardgame" + err }, { status: 500 });
  }
}
