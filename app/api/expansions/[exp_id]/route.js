import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  const { exp_id } = await params;
  try {
    await connectToDB();

    let expansion = null;
    if (mongoose.isValidObjectId(exp_id)) {
      expansion = await Expansion.findById(exp_id).populate("parent_id").exec();
    }
    if (!expansion) {
      expansion = await Expansion.findOne({ slug: exp_id }).populate("parent_id").exec();
    }
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
