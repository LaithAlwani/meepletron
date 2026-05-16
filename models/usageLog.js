// Append-only token-usage log. One document per LLM call (chat answer,
// rerank, PDF parse, embedding). The /admin/site-config dashboard aggregates
// these by month + model to show what the project is spending.
//
// Pre-aggregating by month would save query time but loses per-call audit
// detail. With Mongo's $group + an index on createdAt this stays cheap at
// 10k–100k rows/month.

import { model, models, Schema } from "mongoose";

const usageLogSchema = new Schema(
  {
    // Logical bucket for the call. Helps separate "RAG question answering"
    // from "migration-time PDF parsing" when looking at cost.
    purpose: {
      type: String,
      enum: ["chat-answer", "chat-rerank", "chat-embed", "parse", "embed"],
      required: true,
      index: true,
    },
    // Provider-side model string, e.g. "gemini-2.5-flash" or
    // "text-embedding-3-small".
    model: { type: String, required: true, index: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index on createdAt to make month-bucketed aggregations cheap.
usageLogSchema.index({ createdAt: -1 });

const UsageLog = models.UsageLog || model("UsageLog", usageLogSchema);

export default UsageLog;
