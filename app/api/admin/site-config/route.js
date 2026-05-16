// Admin-only read/write for the singleton SiteConfig. Read is open to admins
// so the form can prefill; PATCH validates each known knob, persists the
// changes, and invalidates the in-memory cache so the next request reads
// fresh values immediately on this process.

import SiteConfig from "@/models/siteConfig";
import connectToDB from "@/utils/database";
import { invalidateSiteConfigCache, DEFAULT_CONFIG } from "@/lib/site-config";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

async function adminGuard() {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const forbidden = await adminGuard();
  if (forbidden) return forbidden;

  await connectToDB();
  const doc = await SiteConfig.findById("default").lean();
  const merged = { ...DEFAULT_CONFIG, ...(doc || {}) };
  delete merged._id;
  delete merged.createdAt;
  delete merged.updatedAt;
  delete merged.__v;
  return NextResponse.json({ data: merged });
}

// Validation rules per field. Each returns the coerced/clamped value or throws.
const VALIDATORS = {
  v2TopK: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error("v2TopK must be a number");
    if (n < 1 || n > 100) throw new Error("v2TopK must be between 1 and 100");
    return Math.round(n);
  },
  v2ScoreThreshold: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error("v2ScoreThreshold must be a number");
    if (n < 0 || n > 1) throw new Error("v2ScoreThreshold must be between 0 and 1");
    return n;
  },
  rerankTopN: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error("rerankTopN must be a number");
    if (n < 1 || n > 20) throw new Error("rerankTopN must be between 1 and 20");
    return Math.round(n);
  },
  historyMessageLimit: (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error("historyMessageLimit must be a number");
    if (n < 1 || n > 50) throw new Error("historyMessageLimit must be between 1 and 50");
    return Math.round(n);
  },
};

export async function PATCH(req) {
  const forbidden = await adminGuard();
  if (forbidden) return forbidden;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const update = {};
  try {
    for (const [key, value] of Object.entries(body || {})) {
      if (!(key in VALIDATORS)) continue; // ignore unknown fields silently
      update[key] = VALIDATORS[key](value);
    }
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
  }

  await connectToDB();
  // strict: false because new fields might land here before a deploy has
  // refreshed the Mongoose model cache.
  const updated = await SiteConfig.findByIdAndUpdate(
    "default",
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true, strict: false },
  ).lean();

  invalidateSiteConfigCache();

  const merged = { ...DEFAULT_CONFIG, ...updated };
  delete merged._id;
  delete merged.createdAt;
  delete merged.updatedAt;
  delete merged.__v;

  return NextResponse.json({ data: merged });
}
