import { auth } from "@clerk/nextjs/server";
import connectToDB from "@/utils/database";
import User from "@/models/user";
import { NextResponse } from "next/server";

const DAILY_TOKEN_LIMIT = 50_000;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ remaining: null }, { status: 200 });

  await connectToDB();
  const user = await User.findOne({ clerk_id: userId }).lean();
  if (!user) return NextResponse.json({ remaining: DAILY_TOKEN_LIMIT, limit: DAILY_TOKEN_LIMIT }, { status: 200 });

  const todayMidnightUTC = new Date();
  todayMidnightUTC.setUTCHours(0, 0, 0, 0);

  const isNewDay = !user.tokens_reset_at || new Date(user.tokens_reset_at) < todayMidnightUTC;
  const used = isNewDay ? 0 : (user.tokens_used_today ?? 0);

  return NextResponse.json({ remaining: DAILY_TOKEN_LIMIT - used, limit: DAILY_TOKEN_LIMIT }, { status: 200 });
}
