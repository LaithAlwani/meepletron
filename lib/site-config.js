// Runtime-mutable site config. Read by chat/parse routes on every request so
// the admin can tune RAG knobs from the /admin/site-config UI without a
// redeploy.
//
// Reads are cached in-memory for ~30 s — long enough to keep retrieval cheap
// (no Mongo hit per chat message) but short enough that PATCHes propagate
// within half a minute even across warm function instances.

import SiteConfig from "@/models/siteConfig";
import connectToDB from "@/utils/database";

// Match the previous module-level constants so we never break callers if
// Mongo is unreachable or the document is missing.
export const DEFAULT_CONFIG = Object.freeze({
  v2TopK: 10,
  v2ScoreThreshold: 0.05,
  rerankTopN: 3,
  historyMessageLimit: 6,
});

const CACHE_TTL_MS = 30_000;

let cached = null;
let cachedAt = 0;

/**
 * Returns the current site config, falling back to `DEFAULT_CONFIG` on any
 * failure. Safe to call from inside chat/parse routes — short-circuits to the
 * in-memory cache when fresh.
 */
export async function getSiteConfig() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  try {
    await connectToDB();
    // .lean() so we get a plain POJO and dodge Mongoose strict-mode
    // field-stripping if the running process has a stale model cache.
    const doc = await SiteConfig.findById("default").lean();
    const merged = {
      ...DEFAULT_CONFIG,
      ...(doc || {}),
    };
    // Mongo doc has _id/timestamps we don't want callers depending on.
    delete merged._id;
    delete merged.createdAt;
    delete merged.updatedAt;
    delete merged.__v;
    cached = merged;
    cachedAt = now;
    return cached;
  } catch (err) {
    console.error("[site-config] read failed; using defaults:", err);
    return DEFAULT_CONFIG;
  }
}

/**
 * Invalidate the in-memory cache. Call from the PATCH endpoint so the next
 * read picks up the new values immediately on this process. Other Vercel
 * function instances will catch up within `CACHE_TTL_MS`.
 */
export function invalidateSiteConfigCache() {
  cached = null;
  cachedAt = 0;
}
