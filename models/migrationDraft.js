// Parsed-but-not-yet-committed chunks for the admin migration review flow.
// The parse endpoint writes one of these; the commit endpoint reads it,
// embeds the accepted chunks, upserts to Pinecone, then marks status=committed.
// Kept around after commit for audit (one row per game).

import { model, models, Schema } from "mongoose";

const draftChunkSchema = new Schema(
  {
    tempId: { type: String, required: true }, // client-stable id used by the review UI
    breadcrumb: { type: String, default: "" },
    page: { type: Number, default: null },
    chunkType: { type: String, default: "text" }, // "text" | "table" | "list" | "legend"
    scope: { type: String, default: "main" }, // "main" | "variant"
    variantName: { type: String, default: null },
    text: { type: String, required: true },
    originalText: { type: String, default: null }, // pre-edit; null until first edit
    flags: [{ type: String }], // ["too-short", "too-long", "no-breadcrumb", "gibberish", "table-fragment"]
    accepted: { type: Boolean, default: true },
    edited: { type: Boolean, default: false },
  },
  { _id: false }
);

const batchPlanEntrySchema = new Schema(
  {
    index: { type: Number, required: true },
    startPage: { type: Number, required: true },
    endPage: { type: Number, required: true },
  },
  { _id: false }
);

const markdownBatchSchema = new Schema(
  {
    index: { type: Number, required: true },
    startPage: { type: Number, required: true },
    endPage: { type: Number, required: true },
    markdown: { type: String, default: "" },
  },
  { _id: false }
);

const migrationDraftSchema = new Schema(
  {
    bg_id: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
    bg_kind: { type: String, enum: ["boardgame", "expansion"], required: true },
    bg_title: { type: String, required: true }, // snapshotted at parse time
    pdfUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["parsing", "parsed", "reviewing", "committed"],
      default: "parsing",
      index: true,
    },
    // Set on the first batch (cursor=0) and reused for every subsequent batch
    // so resume after refresh produces the same boundaries.
    totalPages: { type: Number, default: null },
    batchPlan: { type: [batchPlanEntrySchema], default: [] },
    // Per-batch markdown, accumulated as the loop progresses. The final
    // stitched markdown is materialized into `markdown` once the last batch
    // lands so the review UI keeps working unchanged.
    markdownBatches: { type: [markdownBatchSchema], default: [] },
    // Icon tokens extracted from the first batch's `## Iconography` block.
    // Passed to later batches so they reuse the same tokens consistently.
    iconTokens: { type: [String], default: [] },
    markdown: { type: String, default: "" }, // stitched final markdown, for the preview pane
    chunks: { type: [draftChunkSchema], default: [] },
    removedDuplicates: { type: Number, default: 0 },
    parsedAt: { type: Date, default: Date.now },
    committedAt: { type: Date, default: null },
    geminiUsage: { type: Schema.Types.Mixed, default: null }, // accumulated { promptTokens, completionTokens, totalTokens }
  },
  { timestamps: true }
);

const MigrationDraft =
  models.MigrationDraft || model("MigrationDraft", migrationDraftSchema);

export default MigrationDraft;
