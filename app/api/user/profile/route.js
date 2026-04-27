import User from "@/models/user";
import Chat from "@/models/chat";
import Message from "@/models/message";
import connectToDB from "@/utils/database";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    await connectToDB();

    const user = await User.findOne({ clerk_id: userId }).lean();
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const chatIds = await Chat.find({ user_id: user._id }).distinct("_id");
    const totalChats = chatIds.length;

    const [msgStats] = await Message.aggregate([
      { $match: { chat_id: { $in: chatIds } } },
      {
        $group: {
          _id: null,
          userMessages:   { $sum: { $cond: [{ $eq: ["$role", "user"] },      1, 0] } },
          aiMessages:     { $sum: { $cond: [{ $eq: ["$role", "assistant"] }, 1, 0] } },
          correctRatings: { $sum: { $cond: [{ $eq: ["$rating", "correct"] }, 1, 0] } },
          wrongRatings:   { $sum: { $cond: [{ $eq: ["$rating", "wrong"] },   1, 0] } },
        },
      },
    ]);

    return NextResponse.json({
      data: {
        user,
        totalChats,
        userMessages:   msgStats?.userMessages   ?? 0,
        aiMessages:     msgStats?.aiMessages     ?? 0,
        correctRatings: msgStats?.correctRatings ?? 0,
        wrongRatings:   msgStats?.wrongRatings   ?? 0,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error fetching profile" }, { status: 500 });
  }
}
