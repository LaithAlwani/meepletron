import Chat from "@/models/chat";
import Message from "@/models/message";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";

export async function POST(req) {
  const chatMessage = await req.json();
  
  try {
    await connectToDB();
    await Message.create(chatMessage);
    if (chatMessage.parent_id) {
      await Chat.findOneAndUpdate(
        { boardgame_id: chatMessage.parent_id },
        { last_message_at: Date.now() }
      );
    } else {
      await Chat.findByIdAndUpdate({ _id: chatMessage.chat_id }, { last_message_at: Date.now() });
    }
    return NextResponse.json({ message: "success" }, { status: 201 });
  } catch (err) {
    console.log(err)
    return NextResponse.json({ message: "failed to save message" }, { status: 500 });
  }
}
