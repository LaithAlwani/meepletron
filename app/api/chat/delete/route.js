import Chat from "@/models/chat";
import Message from "@/models/message";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { chat_id, boardgame_id } = await req.json();
  
  try {
    await connectToDB();

    await Message.deleteMany({ chat_id: chat_id});
    await Message.deleteMany({ parent_id: boardgame_id});
    await Chat.findByIdAndDelete({ _id: chat_id });
    await Chat.deleteMany({ parent_id: boardgame_id });

    return NextResponse.json({ message: "Chat Deleted" }, { status: 201 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to Deleted Chat" }, { status: 500 });
  }
}
