import Chat from "@/models/chat";
import Message from "@/models/message";
import User from "@/models/user";
import connectToDB from "@/utils/database";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = await params;
  const { userId } = await auth();

  try {
    await connectToDB();
    const user = await User.findOne({ clerk_id: userId }).lean();
    if (!user) return NextResponse.json({ message: "user not found" }, { status: 404 });
    const chat = await Chat.findOne({ boardgame_id: id, user_id: user._id }).lean();
    
    if (!chat)
      return NextResponse.json(
        { data: { chat: {}, messages: [] }, message: "create a new chat" },
        { status: 200 }
      );
    let messages = await Message.find({ chat_id: chat._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    if (!messages) messages = [];

    return NextResponse.json({ data: { chat, messages }, message: "success" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Error in fetching boardgame" + err }, { status: 500 });
  }
}

export async function POST(req) {
  const { user_id, boardgame_id, parent_id } = await req.json();
  console.log(parent_id)
  await connectToDB();

  const user = await User.findOne({ clerk_id: user_id }).lean();
  if (!user) return "user not found";

  const chat = await Chat.create({ user_id: user._id, boardgame_id, parent_id });

  try {
    return NextResponse.json({ data: chat, message: "Chat Created" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: "Failed to create Chat" }, { status: 500 });
  }
}