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

    // Increment the view counter atomically without blocking the response.
    // `$inc` rewrites a single field; the prior `expansion.save()` revalidated
    // and rewrote the whole document (and re-ran the slug pre-save hook) on
    // every view.
    Expansion.updateOne({ _id: expansion._id }, { $inc: { counter: 1 } }).catch(() => {});

    return NextResponse.json(expansion, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Error in fetching boardgame" + err }, { status: 500 });
  }
}
