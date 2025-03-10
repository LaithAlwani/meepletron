import Message from "@/models/message";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { id, rating } = await req.json();

  try {
    await connectToDB();
    await Message.findByIdAndUpdate({ _id: id }, { rating:rating });
    
    return NextResponse.json({ message: "Thank you for your feedback" }, { status: 201 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "failed to save message" }, { status: 500 });
  }
}
