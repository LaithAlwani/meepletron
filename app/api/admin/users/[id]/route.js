import User from "@/models/user";
import Chat from "@/models/chat";
import Message from "@/models/message";
import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(_req, { params }) {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await connectToDB();

    const user = await User.findById(id).lean();
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const chats = await Chat.find({ user_id: user._id })
      .populate({ path: "boardgame_id", model: Boardgame, select: "title thumbnail" })
      .sort({ last_message_at: -1, createdAt: -1 })
      .lean();

    const chatIds = chats.map((c) => c._id);
    const messages = await Message.find({ chat_id: { $in: chatIds } })
      .sort({ createdAt: 1 })
      .lean();

    const messagesByChat = messages.reduce((acc, m) => {
      const key = m.chat_id.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});

    const enrichedChats = chats.map((c) => ({
      _id: c._id,
      boardgame: c.boardgame_id || null,
      createdAt: c.createdAt,
      last_message_at: c.last_message_at,
      messages: messagesByChat[c._id.toString()] || [],
    }));

    let userMessages = 0;
    let aiMessages = 0;
    let correctRatings = 0;
    let wrongRatings = 0;
    for (const m of messages) {
      if (m.role === "user") userMessages++;
      else if (m.role === "assistant") {
        aiMessages++;
        if (m.rating === "correct") correctRatings++;
        else if (m.rating === "wrong") wrongRatings++;
      }
    }

    return NextResponse.json({
      data: {
        user,
        chats: enrichedChats,
        stats: {
          totalChats: chats.length,
          userMessages,
          aiMessages,
          correctRatings,
          wrongRatings,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error fetching user" }, { status: 500 });
  }
}
