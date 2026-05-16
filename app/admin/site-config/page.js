"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { MdArrowBack, MdSave, MdRefresh, MdTune, MdReceiptLong } from "react-icons/md";
import Loader from "@/components/Loader";

// Number-input field with a label, hint, and inline help text.
function NumberField({ label, hint, value, onChange, step = 1, min, max }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-subtle">{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      {hint && <span className="block text-[11px] text-muted mt-1">{hint}</span>}
    </label>
  );
}

function fmtNum(n) {
  if (n == null) return "—";
  return n.toLocaleString();
}

function fmtCost(usd) {
  if (usd == null || !Number.isFinite(usd)) return "—";
  if (usd < 0.01) return `< $0.01`;
  return `$${usd.toFixed(2)}`;
}

const PURPOSE_LABELS = {
  "chat-answer": "Chat answer (Gemini)",
  "chat-rerank": "Chat rerank (Gemini)",
  "chat-embed": "Chat embed (OpenAI)",
  parse: "PDF parse (Gemini)",
  embed: "Migration embed (OpenAI)",
};

export default function SiteConfigPage() {
  const [config, setConfig] = useState(null);
  const [draft, setDraft] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadConfig() {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/admin/site-config");
      const { data } = await res.json();
      setConfig(data);
      setDraft(data);
    } catch (err) {
      toast.error("Failed to load site config");
    } finally {
      setLoadingConfig(false);
    }
  }

  async function loadUsage() {
    setLoadingUsage(true);
    try {
      const res = await fetch("/api/admin/usage");
      const { data } = await res.json();
      setUsage(data);
    } catch (err) {
      toast.error("Failed to load usage");
    } finally {
      setLoadingUsage(false);
    }
  }

  useEffect(() => {
    loadConfig();
    loadUsage();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Save failed");
        return;
      }
      setConfig(json.data);
      setDraft(json.data);
      toast.success("Saved — new values active on the next request (cache TTL ~30 s)");
    } catch (err) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    config && draft &&
    Object.keys(draft).some((k) => draft[k] !== config[k]);

  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin" className="text-subtle hover:text-foreground transition-colors text-sm">
            ← Back
          </Link>
          <span className="text-border">/</span>
          <h1 className="text-2xl font-bold text-foreground">Site Config</h1>
        </div>

        <p className="text-sm text-muted mb-8 max-w-2xl">
          Tune the RAG retrieval knobs at runtime — no redeploy required. Saved
          values are cached for ~30&nbsp;s on each function instance, so changes
          propagate within half a minute.
        </p>

        {/* RAG tuning */}
        <section className="mb-10">
          <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-subtle mb-3">
            <MdTune size={16} /> RAG tuning (v2)
          </h2>
          {loadingConfig || !draft ? (
            <div className="flex justify-center py-10"><Loader width="3rem" /></div>
          ) : (
            <div className="bg-surface rounded-2xl border border-border-muted shadow-sm p-5 space-y-4">
              <NumberField
                label="Pinecone top-K (v2)"
                hint="How many candidate chunks Pinecone returns per query before reranking. Higher = more for the reranker to choose from, more cost. Default 10."
                value={draft.v2TopK}
                onChange={(v) => setDraft({ ...draft, v2TopK: v })}
                step={1} min={1} max={100}
              />
              <NumberField
                label="Score threshold (v2)"
                hint="Cosine-similarity floor below which chunks are dropped pre-rerank. Lower = more permissive. 0 keeps everything. Default 0.05."
                value={draft.v2ScoreThreshold}
                onChange={(v) => setDraft({ ...draft, v2ScoreThreshold: v })}
                step={0.01} min={0} max={1}
              />
              <NumberField
                label="Reranker top-N"
                hint="How many chunks the reranker keeps and sends to the chat model. Higher = more context, more tokens. Default 3."
                value={draft.rerankTopN}
                onChange={(v) => setDraft({ ...draft, rerankTopN: v })}
                step={1} min={1} max={20}
              />
              <NumberField
                label="Conversation history limit"
                hint="How many of the most recent messages (user + assistant) to include in each chat call. Lower = cheaper, less context recall. Default 6."
                value={draft.historyMessageLimit}
                onChange={(v) => setDraft({ ...draft, historyMessageLimit: v })}
                step={1} min={1} max={50}
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-muted">
                <button
                  type="button"
                  onClick={() => setDraft(config)}
                  disabled={!dirty || saving}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-surface hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Revert
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={!dirty || saving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-fg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {saving ? (<><Loader width="0.8rem" /> Saving…</>) : (<><MdSave size={14} /> Save</>)}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Monthly usage */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-subtle">
              <MdReceiptLong size={16} /> Token usage ({usage?.month || "this month"})
            </h2>
            <button
              type="button"
              onClick={loadUsage}
              disabled={loadingUsage}
              className="inline-flex items-center gap-1 text-xs text-subtle hover:text-foreground transition-colors">
              <MdRefresh size={14} className={loadingUsage ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {loadingUsage || !usage ? (
            <div className="flex justify-center py-10"><Loader width="3rem" /></div>
          ) : (
            <div className="bg-surface rounded-2xl border border-border-muted shadow-sm overflow-hidden">
              {/* Totals row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-surface-muted/40 border-b border-border-muted text-center">
                <Stat label="Calls" value={fmtNum(usage.totals.calls)} />
                <Stat label="Input tokens" value={fmtNum(usage.totals.promptTokens)} />
                <Stat label="Output tokens" value={fmtNum(usage.totals.completionTokens)} />
                <Stat label="Total tokens" value={fmtNum(usage.totals.totalTokens)} />
                <Stat label="Est. cost" value={fmtCost(usage.totals.estCostUsd)} highlight />
              </div>

              {/* Per-group breakdown */}
              {usage.byGroup.length === 0 ? (
                <p className="text-center text-sm text-subtle py-10">
                  No usage recorded this month yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-muted/40 text-subtle uppercase tracking-wide text-[10px]">
                      <tr>
                        <th className="text-left px-4 py-2">Purpose</th>
                        <th className="text-left px-4 py-2">Model</th>
                        <th className="text-right px-4 py-2">Calls</th>
                        <th className="text-right px-4 py-2">Input</th>
                        <th className="text-right px-4 py-2">Output</th>
                        <th className="text-right px-4 py-2">Total</th>
                        <th className="text-right px-4 py-2">Est. cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-muted">
                      {usage.byGroup.map((r, i) => (
                        <tr key={i} className="hover:bg-surface-muted/30">
                          <td className="px-4 py-2 text-foreground font-medium">
                            {PURPOSE_LABELS[r.purpose] || r.purpose}
                          </td>
                          <td className="px-4 py-2 text-muted font-mono">{r.model}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{fmtNum(r.calls)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{fmtNum(r.promptTokens)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{fmtNum(r.completionTokens)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{fmtNum(r.totalTokens)}</td>
                          <td className="px-4 py-2 text-right tabular-nums font-semibold">{fmtCost(r.estCostUsd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <p className="text-[11px] text-subtle mt-3">
            Costs are estimates only, based on hard-coded per-million-token pricing in
            <code className="ml-1 font-mono">lib/usage-tracker.js</code>. Verify against your Google + OpenAI billing dashboards.
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight = false }) {
  return (
    <div>
      <div className={`text-lg font-bold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide font-medium text-subtle">{label}</div>
    </div>
  );
}
