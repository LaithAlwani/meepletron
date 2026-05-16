// Aggregates this month's UsageLog rows by (purpose, model). Returns total
// prompt / completion tokens and an estimated cost in USD per group, plus a
// grand total. Used by the /admin/site-config dashboard.

import UsageLog from "@/models/usageLog";
import connectToDB from "@/utils/database";
import { estimateCost, MODEL_PRICING } from "@/lib/usage-tracker";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // Default: current calendar month (UTC). `?month=YYYY-MM` for backfill views.
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // "YYYY-MM"
  const now = new Date();
  const monthStart = monthParam
    ? new Date(`${monthParam}-01T00:00:00.000Z`)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1),
  );

  await connectToDB();

  const rows = await UsageLog.aggregate([
    { $match: { createdAt: { $gte: monthStart, $lt: nextMonthStart } } },
    {
      $group: {
        _id: { purpose: "$purpose", model: "$model" },
        promptTokens: { $sum: "$promptTokens" },
        completionTokens: { $sum: "$completionTokens" },
        totalTokens: { $sum: "$totalTokens" },
        calls: { $sum: 1 },
      },
    },
    { $sort: { totalTokens: -1 } },
  ]);

  const byGroup = rows.map((r) => ({
    purpose: r._id.purpose,
    model: r._id.model,
    promptTokens: r.promptTokens,
    completionTokens: r.completionTokens,
    totalTokens: r.totalTokens,
    calls: r.calls,
    estCostUsd: estimateCost({
      model: r._id.model,
      promptTokens: r.promptTokens,
      completionTokens: r.completionTokens,
    }),
  }));

  const totals = byGroup.reduce(
    (acc, r) => ({
      promptTokens: acc.promptTokens + r.promptTokens,
      completionTokens: acc.completionTokens + r.completionTokens,
      totalTokens: acc.totalTokens + r.totalTokens,
      calls: acc.calls + r.calls,
      estCostUsd: acc.estCostUsd + r.estCostUsd,
    }),
    { promptTokens: 0, completionTokens: 0, totalTokens: 0, calls: 0, estCostUsd: 0 },
  );

  return NextResponse.json({
    data: {
      month: monthStart.toISOString().slice(0, 7),
      monthStart: monthStart.toISOString(),
      monthEnd: nextMonthStart.toISOString(),
      byGroup,
      totals,
      pricing: MODEL_PRICING,
    },
  });
}
