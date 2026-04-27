import Message from "@/models/message";
import connectToDB from "@/utils/database";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    await connectToDB();

    const [result] = await Message.aggregate([
      {
        $group: {
          _id: null,
          total:          { $sum: 1 },
          userMessages:   { $sum: { $cond: [{ $eq: ["$role", "user"] },      1, 0] } },
          aiMessages:     { $sum: { $cond: [{ $eq: ["$role", "assistant"] }, 1, 0] } },
          correctRatings: { $sum: { $cond: [{ $eq: ["$rating", "correct"] }, 1, 0] } },
          wrongRatings:   { $sum: { $cond: [{ $eq: ["$rating", "wrong"] },   1, 0] } },
          unratedAI:      { $sum: { $cond: [{ $and: [{ $eq: ["$role", "assistant"] }, { $eq: ["$rating", ""] }] }, 1, 0] } },
        },
      },
    ]);

    const data = result
      ? { total: result.total, userMessages: result.userMessages, aiMessages: result.aiMessages, correctRatings: result.correctRatings, wrongRatings: result.wrongRatings, unratedAI: result.unratedAI }
      : { total: 0, userMessages: 0, aiMessages: 0, correctRatings: 0, wrongRatings: 0, unratedAI: 0 };

    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error fetching stats" }, { status: 500 });
  }
}
