import User from "@/models/user";
import Chat from "@/models/chat";
import Message from "@/models/message";
import connectToDB from "@/utils/database";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const clean = (v) => {
    if (typeof v !== "string") return null;
    const trimmed = v.trim();
    return trimmed.length === 0 ? null : trimmed.slice(0, 100);
  };

  const username = clean(body.username);
  const first_name = clean(body.first_name);
  const last_name = clean(body.last_name);

  if (!username) {
    return NextResponse.json({ message: "Username is required" }, { status: 400 });
  }

  // Update Clerk first — it owns username uniqueness and sign-in identity.
  // If Clerk rejects (taken, invalid format), bail before touching Mongo so they stay in sync.
  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, { username });
  } catch (err) {
    const msg =
      err?.errors?.[0]?.longMessage ||
      err?.errors?.[0]?.message ||
      "Failed to update username in Clerk";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  try {
    await connectToDB();
    const updated = await User.findOneAndUpdate(
      { clerk_id: userId },
      { $set: { first_name, last_name, username } },
      { new: true }
    ).lean();

    if (!updated) return NextResponse.json({ message: "User not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error updating profile" }, { status: 500 });
  }
}

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
