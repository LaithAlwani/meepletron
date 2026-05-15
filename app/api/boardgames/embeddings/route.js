// Deprecated: legacy v1 ingestion endpoint.
// Rulebook chunking + embedding now lives behind the admin migration UI
// (Stage 11 review-before-commit). Hitting this endpoint just signals callers
// to use the new flow under /admin/boardgames/migrate.

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST() {
  const { sessionClaims } = await auth();
  if (sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
  }
  return NextResponse.json(
    {
      message:
        "This endpoint has been retired. Use /admin/boardgames/migrate to parse, review and commit rulebook chunks for any game.",
    },
    { status: 410 },
  );
}
