// Fire-and-forget usage logger. Each LLM call writes one UsageLog row so the
// admin dashboard at /admin/site-config can show monthly token totals + an
// estimated cost.
//
// Important: this is NEVER awaited from request paths — a Mongo write should
// not delay or fail a user-facing response. Use `recordUsage()` from inside
// `onFinish` / `try` blocks; errors are caught and logged.

import UsageLog from "@/models/usageLog";
import connectToDB from "@/utils/database";

/**
 * @param {object} args
 * @param {"chat-answer"|"chat-rerank"|"chat-embed"|"parse"|"embed"} args.purpose
 * @param {string} args.model — provider model string
 * @param {{ promptTokens?: number, completionTokens?: number, totalTokens?: number }} [args.usage]
 */
export function recordUsage({ purpose, model, usage }) {
  if (!usage) return; // some SDK responses don't include usage on failure
  // Fire and forget — never block the caller.
  (async () => {
    try {
      await connectToDB();
      await UsageLog.create({
        purpose,
        model,
        promptTokens: usage.promptTokens ?? 0,
        completionTokens: usage.completionTokens ?? 0,
        totalTokens:
          usage.totalTokens ??
          (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0),
      });
    } catch (err) {
      console.error("[usage-tracker] write failed (non-fatal):", err);
    }
  })();
}

// Approximate USD pricing as of model availability. Update these when
// pricing changes — they're used by the admin dashboard only, not billing.
//
//   gemini-2.5-flash:        $0.075/1M input, $0.30/1M output
//   gemini-2.5-flash-lite:   $0.0375/1M input, $0.15/1M output
//   text-embedding-3-small:  $0.02/1M input
//   text-embedding-3-large:  $0.13/1M input
export const MODEL_PRICING = {
  "gemini-2.5-flash": { inputPerM: 0.075, outputPerM: 0.3 },
  "gemini-2.5-flash-lite": { inputPerM: 0.0375, outputPerM: 0.15 },
  "text-embedding-3-small": { inputPerM: 0.02, outputPerM: 0 },
  "text-embedding-3-large": { inputPerM: 0.13, outputPerM: 0 },
};

export function estimateCost({ model, promptTokens, completionTokens }) {
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  return (
    (promptTokens * p.inputPerM) / 1_000_000 +
    (completionTokens * p.outputPerM) / 1_000_000
  );
}
