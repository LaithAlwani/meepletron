import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { exp_id } = await params;
  try {
    await connectToDB();
    const expansion = await Expansion.findById({ _id: exp_id }).populate("parent_id").exec();
    if (!expansion) return NextResponse.json({ message: "expansion not found" }, { status: 404 });
    //adds +1 to board game counter
    expansion.counter += 1;
    await expansion.save();

    return NextResponse.json(expansion, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Error in fetching boardgame" + err }, { status: 500 });
  }
}
