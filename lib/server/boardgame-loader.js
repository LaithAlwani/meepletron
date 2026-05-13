// Direct-DB loaders for server components in the /boardgames route subtree.
// Replaces the prior pattern of fetching back into our own /api routes via
// `fetch(${siteUrl}/api/boardgames/${id})` — which broke when the dev server
// ran on a port other than the hardcoded one. Server components should hit
// the data layer directly anyway.

import mongoose from "mongoose";
import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";

// Strip Mongoose internals + ObjectIds/Dates so the doc can flow into
// client components and generateMetadata exactly like the API response did.
function serialize(doc) {
  return doc ? JSON.parse(JSON.stringify(doc)) : null;
}

export async function loadBoardgame(idOrSlug) {
  if (!idOrSlug) return null;
  await connectToDB();

  let bg = null;
  if (mongoose.isValidObjectId(idOrSlug)) {
    bg = await Boardgame.findById(idOrSlug).populate("expansions").lean();
  }
  if (!bg) {
    bg = await Boardgame.findOne({ slug: idOrSlug }).populate("expansions").lean();
  }
  return serialize(bg);
}

export async function loadExpansion(idOrSlug) {
  if (!idOrSlug) return null;
  await connectToDB();

  let exp = null;
  if (mongoose.isValidObjectId(idOrSlug)) {
    exp = await Expansion.findById(idOrSlug).populate("parent_id").lean();
  }
  if (!exp) {
    exp = await Expansion.findOne({ slug: idOrSlug }).populate("parent_id").lean();
  }
  return serialize(exp);
}
