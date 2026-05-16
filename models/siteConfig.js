// Singleton config document holding RAG tuning knobs that the admin can edit
// at runtime from /admin/site-config — no redeploy needed.
//
// Conventionally `_id: "default"` so there's exactly one row. Reads go through
// lib/site-config.js which caches the doc in memory for 30 s.

import { model, models, Schema } from "mongoose";

const siteConfigSchema = new Schema(
  {
    _id: { type: String, default: "default" },

    // RAG retrieval (v2 pipeline)
    v2TopK: { type: Number, default: 10 },           // Pinecone candidates per query
    v2ScoreThreshold: { type: Number, default: 0.05 }, // permissive floor; reranker is the real gate
    rerankTopN: { type: Number, default: 3 },         // final chunks passed to the chat LLM

    // Chat input shaping
    historyMessageLimit: { type: Number, default: 6 }, // include the last N messages of the conversation (current question counts)
  },
  { timestamps: true, _id: false } // _id is a fixed string, not auto-ObjectId
);

const SiteConfig =
  models.SiteConfig || model("SiteConfig", siteConfigSchema);

export default SiteConfig;
