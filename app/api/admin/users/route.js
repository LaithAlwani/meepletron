import User from "@/models/user";
import connectToDB from "@/utils/database";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PAGE_SIZE = 20;
const VALID_SORT_FIELDS = ["updatedAt", "chatCount", "aiMessageCount", "name"];

export async function GET(req) {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const skip = (page - 1) * PAGE_SIZE;
  const sortBy = VALID_SORT_FIELDS.includes(searchParams.get("sortBy"))
    ? searchParams.get("sortBy")
    : "updatedAt";
  const sortDir = searchParams.get("sortDir") === "asc" ? 1 : -1;
  const nameDir = searchParams.get("nameDir") === "desc" ? -1 : 1;

  const sortObj =
    sortBy === "name"
      ? { first_name: sortDir, last_name: sortDir }
      : { [sortBy]: sortDir, first_name: nameDir, last_name: nameDir };

  try {
    await connectToDB();

    const users = await User.aggregate([
      // Lookups before sort so computed fields are available for all sort keys
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
        $addFields: {
          chatCount: { $size: "$chats" },
          aiMessageCount: { $size: "$aiMessages" },
        },
      },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: PAGE_SIZE },
      {
        $project: {
          first_name: 1,
          last_name: 1,
          email_address: 1,
          avatar: 1,
          createdAt: 1,
          updatedAt: 1,
          chatCount: 1,
          aiMessageCount: 1,
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
