import User from "@/models/user";
import connectToDB from "@/utils/database";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PAGE_SIZE = 20;

export async function GET(req) {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  try {
    await connectToDB();

    const users = await User.aggregate([
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: PAGE_SIZE },
      {
        $lookup: {
          from: "chats",
          localField: "_id",
          foreignField: "user_id",
          as: "chats",
        },
      },
      {
        $lookup: {
          from: "messages",
          let: { chatIds: "$chats._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$chat_id", "$$chatIds"] },
                    { $eq: ["$role", "assistant"] },
                  ],
                },
              },
            },
            { $project: { rating: 1 } },
          ],
          as: "aiMessages",
        },
      },
      {
        $project: {
          first_name: 1,
          last_name: 1,
          email_address: 1,
          avatar: 1,
          createdAt: 1,
          updatedAt: 1,
          chatCount: { $size: "$chats" },
          aiMessageCount: { $size: "$aiMessages" },
          correctRatings: {
            $size: {
              $filter: {
                input: "$aiMessages",
                as: "m",
                cond: { $eq: ["$$m.rating", "correct"] },
              },
            },
          },
          wrongRatings: {
            $size: {
              $filter: {
                input: "$aiMessages",
                as: "m",
                cond: { $eq: ["$$m.rating", "wrong"] },
              },
            },
          },
        },
      },
    ]);

    return NextResponse.json({ data: users, hasMore: users.length === PAGE_SIZE });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error fetching users" }, { status: 500 });
  }
}
