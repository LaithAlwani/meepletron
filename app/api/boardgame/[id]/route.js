import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function GET(req,{params}) {
  const {id} =  await params;
  try {
    await connectToDB();
    const boardgame = await Boardgame.findOne({ _id: id });
    const expansions = await Expansion.find({ parent_id: id },{thumbnail:1,title:1})
    return NextResponse.json({data:{boardgame, expansions}}, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Error in fetching boardgame" + err }, { status: 500 });
  }
}
