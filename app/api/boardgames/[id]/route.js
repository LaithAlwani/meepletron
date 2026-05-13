import Boardgame from "@/models/boardgame";
import "@/models/expansion"; // register Expansion model so populate("expansions") works
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  const { id } = await params;
  try {
    await connectToDB();

    let boardgame = null;
    if (mongoose.isValidObjectId(id)) {
      boardgame = await Boardgame.findById(id).populate("expansions").exec();
    }
    if (!boardgame) {
      boardgame = await Boardgame.findOne({ slug: id }).populate("expansions").exec();
    }

    if (!boardgame) return NextResponse.json({ message: "board game not found" }, { status: 404 });

    return NextResponse.json({ data: boardgame }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Error fetching boardgame: " + err }, { status: 500 });
  }
}
