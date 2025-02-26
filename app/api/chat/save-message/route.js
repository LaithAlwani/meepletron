import Message from "@/models/message";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  const chatMessage = await req.json();
  try {
    await connectToDB();
    await Message.create(chatMessage);
    return NextResponse.json({ message: "success" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: "failed to save message" }, { status: 500 });
  }
}
