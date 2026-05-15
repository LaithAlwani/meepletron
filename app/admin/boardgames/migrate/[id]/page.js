"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  MdArrowBack,
  MdCheck,
  MdClose,
  MdRefresh,
  MdWarningAmber,
  MdEdit,
  MdRestore,
  MdPlayArrow,
  MdCheckCircle,
  MdContentCopy,
} from "react-icons/md";
import Loader from "@/components/Loader";

const FLAG_LABELS = {
  "too-short": "Too short",
  "too-long": "Too long",
  "no-breadcrumb": "No section",
  gibberish: "May be garbled",
  "table-fragment": "Partial table",
};

const FLAG_TONE = {
  "too-short": "amber",
  "too-long": "amber",
  "no-breadcrumb": "amber",
  gibberish: "red",
  "table-fragment": "red",
};

export default function MigrateReviewPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(null); // { batchIndex, totalBatches, endPage, totalPages }
  const [batchTimings, setBatchTimings] = useState([]); // [{ index, startPage, endPage, elapsedMs }]
  const [discoverMs, setDiscoverMs] = useState(null);
  const [committing, setCommitting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [savingIndicator, setSavingIndicator] = useState(false);

  const pendingUpdatesRef = useRef(new Map());
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/migrate-game/draft?id=${id}`);
        if (cancelled) return;
        if (res.ok) {
          const { data } = await res.json();
          setDraft(data);
          setChunks(data.chunks);
        } else if (res.status === 404) {
          setDraft(null);
        }
      } catch (err) {
        toast.error("Failed to load draft");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // ─── auto-save ────────────────────────────────────────────────────────────
  async function flushPending() {
    if (pendingUpdatesRef.current.size === 0) return;
    const chunkUpdates = Array.from(pendingUpdatesRef.current.entries()).map(
      ([tempId, patch]) => ({ tempId, ...patch }),
    );
    pendingUpdatesRef.current = new Map();
    setSavingIndicator(true);
    try {
      const res = await fetch(`/api/admin/migrate-game/draft?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chunkUpdates }),
      });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({}));
        toast.error(message || "Auto-save failed");
      }
    } catch (err) {
      toast.error("Auto-save network error");
    } finally {
      setSavingIndicator(false);
    }
  }

  function queueUpdate(tempId, patch) {
    const existing = pendingUpdatesRef.current.get(tempId) || {};
    pendingUpdatesRef.current.set(tempId, { ...existing, ...patch });
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(flushPending, 800);
  }

  function setChunk(tempId, patch) {
    setChunks((prev) =>
      prev.map((c) =>
        c.tempId === tempId
          ? {
              ...c,
              ...patch,
              edited:
                patch.text !== undefined && patch.text !== c.text
                  ? true
                  : c.edited,
              originalText:
                patch.text !== undefined && patch.text !== c.text && !c.edited
                  ? c.text
                  : c.originalText,
            }
          : c,
      ),
    );
    queueUpdate(tempId, patch);
  }

  function revertChunk(tempId) {
    const target = chunks.find((c) => c.tempId === tempId);
    if (!target || !target.originalText) return;
    setChunks((prev) =>
      prev.map((c) =>
        c.tempId === tempId
          ? { ...c, text: c.originalText, edited: false, originalText: null }
          : c,
      ),
    );
    queueUpdate(tempId, { text: target.originalText });
  }

  function bulkSet(predicate, accepted) {
    setChunks((prev) =>
      prev.map((c) =>
        predicate(c) && c.accepted !== accepted ? { ...c, accepted } : c,
      ),
    );
    chunks.forEach((c) => {
      if (predicate(c) && c.accepted !== accepted) {
        queueUpdate(c.tempId, { accepted });
      }
    });
  }

  // ─── actions ──────────────────────────────────────────────────────────────

  // Run the resumable parse loop. `initialCursor` lets us resume an
  // interrupted run from the last completed batch's endPage.
  //
  // On a fresh start (cursor=0) we first call /parse-discover, which does
  // the one-time setup work (PDF download, page-count read, batch plan).
  // The discover time shows separately in the UI so batch timings aren't
  // muddied by that one-time cost.
  async function runParseLoop(initialCursor = 0) {
    setParsing(true);
    setParseProgress(null);
    setBatchTimings([]);
    setDiscoverMs(null);

    let cursor = initialCursor;
    try {
      if (initialCursor === 0) {
        const discoverRes = await fetch(
          `/api/admin/migrate-game/parse-discover?id=${id}`,
          { method: "POST" },
        );
        const discoverJson = await discoverRes.json();
        if (!discoverRes.ok) {
          toast.error(discoverJson.message || "Discovery failed");
          return;
        }
        const { totalPages, totalBatches, elapsedMs } = discoverJson.data;
        setDiscoverMs(elapsedMs ?? null);
        setParseProgress({
          totalPages,
          totalBatches,
          batchIndex: -1,
          startPage: 0,
          endPage: 0,
          isComplete: false,
        });
      }

      while (true) {
        const res = await fetch(
          `/api/admin/migrate-game/parse?id=${id}&cursor=${cursor}`,
          { method: "POST" },
        );
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.message || "Parse failed");
          return;
        }
        const progress = json.data;
        setParseProgress(progress);
        setBatchTimings((prev) => [
          ...prev,
          {
            index: progress.batchIndex,
            startPage: progress.startPage,
            endPage: progress.endPage,
            elapsedMs: progress.elapsedMs ?? null,
          },
        ]);
        cursor = progress.endPage;
        if (progress.isComplete) break;
      }
      // Final batch landed — pull the finalized draft (with chunks) from server.
      const draftRes = await fetch(`/api/admin/migrate-game/draft?id=${id}`);
      if (draftRes.ok) {
        const { data } = await draftRes.json();
        setDraft(data);
        setChunks(data.chunks);
        toast.success(`Parsed ${data.chunks.length} chunks`);
      } else {
        toast.error("Parse finished but couldn't reload the draft");
      }
    } catch (err) {
      toast.error("Parse failed: " + err.message);
    } finally {
      setParsing(false);
      setParseProgress(null);
    }
  }

  function startParse() {
    return runParseLoop(0);
  }

  function resumeParse() {
    // Continue from where the prior run left off. The cursor is the highest
    // endPage already in markdownBatches; if none yet, start from 0.
    const batches = draft?.markdownBatches || [];
    const lastEnd = batches.reduce((m, b) => Math.max(m, b.endPage || 0), 0);
    return runParseLoop(lastEnd);
  }

  async function commit() {
    setCommitting(true);
    await flushPending();
    try {
      const res = await fetch(`/api/admin/migrate-game/commit?id=${id}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Commit failed");
        return;
      }
      toast.success(`Committed ${json.data.committed} chunks → v2!`);
      router.push("/admin/boardgames/migrate");
    } catch (err) {
      toast.error("Commit failed: " + err.message);
    } finally {
      setCommitting(false);
    }
  }

  async function discard() {
    if (!confirm("Discard this draft? Parsing will start over.")) return;
    setDiscarding(true);
    try {
      await fetch(`/api/admin/migrate-game/draft?id=${id}`, { method: "DELETE" });
      setDraft(null);
      setChunks([]);
      toast.success("Draft discarded");
    } catch (err) {
      toast.error("Failed to discard");
    } finally {
      setDiscarding(false);
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader width="4rem" />
      </div>
    );
  }

  if (!draft) {
    return (
      <StartParseScreen
        mode="fresh"
        onStart={startParse}
        parsing={parsing}
        progress={parseProgress}
        batchTimings={batchTimings}
        discoverMs={discoverMs}
      />
    );
  }

  if (draft.status === "parsing") {
    return (
      <StartParseScreen
        mode="resume"
        onStart={resumeParse}
        parsing={parsing}
        progress={parseProgress}
        batchTimings={batchTimings}
        discoverMs={discoverMs}
        draft={draft}
      />
    );
  }

  const acceptedCount = chunks.filter((c) => c.accepted).length;
  const flaggedCount = chunks.filter((c) => c.flags?.length > 0).length;
  const editedCount = chunks.filter((c) => c.edited).length;
  const commitDisabled = committing || acceptedCount === 0;

  return (
    <div className="min-h-screen bg-bg pt-24 pb-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/boardgames/migrate"
            className="text-subtle hover:text-foreground transition-colors text-sm inline-flex items-center gap-1">
            <MdArrowBack size={16} /> Back
          </Link>
          <span className="text-border">/</span>
          <h1 className="text-xl font-bold text-foreground truncate max-w-md">
            {draft.bg_title}
          </h1>
          {draft.bg_kind === "expansion" && (
            <span className="text-[11px] uppercase tracking-wide text-subtle font-medium">
              Expansion
            </span>
          )}
          <div className="ml-auto flex items-center gap-2 text-xs text-subtle">
            {savingIndicator ? (
              <span className="inline-flex items-center gap-1">
                <MdRefresh size={12} className="animate-spin" /> saving…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <MdCheckCircle size={12} className="text-green-600 dark:text-green-400" />
                saved
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
          <Stat label="Total" value={chunks.length} />
          <Stat label="Accepted" value={acceptedCount} tone="green" />
          <Stat label="Flagged" value={flaggedCount} tone={flaggedCount > 0 ? "amber" : "neutral"} />
          <Stat label="Edited" value={editedCount} />
        </div>

        {draft.removedDuplicates > 0 && (
          <div className="text-xs text-subtle mb-4">
            {draft.removedDuplicates} exact-duplicate chunks were removed during parsing (page headers/footers, repeated TOC entries).
          </div>
        )}

        {/* Bulk actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <BulkButton onClick={() => bulkSet(() => true, true)}>
            Accept all
          </BulkButton>
          <BulkButton onClick={() => bulkSet(() => true, false)}>
            Reject all
          </BulkButton>
          {flaggedCount > 0 && (
            <BulkButton onClick={() => bulkSet((c) => c.flags?.length > 0, false)} tone="amber">
              Reject flagged ({flaggedCount})
            </BulkButton>
          )}
          <BulkButton onClick={discard} tone="red" disabled={discarding}>
            {discarding ? "…" : "Discard & start over"}
          </BulkButton>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4">
          {/* Markdown preview */}
          <div className="min-w-0 bg-surface rounded-2xl border border-border-muted shadow-sm overflow-hidden lg:sticky lg:top-24 lg:max-h-[calc(100vh-9rem)]">
            <div className="px-4 py-2.5 border-b border-border-muted flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-subtle font-semibold">
                Parsed markdown
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(draft.markdown || "");
                  toast.success("Copied to clipboard");
                }}
                className="text-xs text-subtle hover:text-foreground inline-flex items-center gap-1">
                <MdContentCopy size={12} /> copy
              </button>
            </div>
            <pre className="text-[12px] leading-relaxed text-foreground p-4 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words font-mono max-h-[600px] lg:max-h-[calc(100vh-13rem)]">
              {draft.markdown}
            </pre>
          </div>

          {/* Chunk list */}
          <div className="min-w-0 space-y-2">
            {chunks.map((chunk, idx) => (
              <ChunkRow
                key={chunk.tempId}
                chunk={chunk}
                index={idx}
                onChange={(patch) => setChunk(chunk.tempId, patch)}
                onRevert={() => revertChunk(chunk.tempId)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sticky commit footer */}
      <div className="fixed bottom-0 inset-x-0 bg-surface border-t border-border-muted shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="font-semibold text-foreground tabular-nums">
              {acceptedCount}
            </span>
            <span className="text-muted"> of </span>
            <span className="text-muted tabular-nums">{chunks.length}</span>
            <span className="text-muted"> chunks accepted</span>
            {editedCount > 0 && (
              <span className="text-muted"> · {editedCount} edited</span>
            )}
          </div>
          <button
            type="button"
            onClick={commit}
            disabled={commitDisabled}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-primary text-primary-fg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm inline-flex items-center gap-2">
            {committing ? (
              <>
                <Loader width="0.9rem" /> Committing…
              </>
            ) : (
              <>
                <MdCheckCircle size={16} /> Commit to Pinecone
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── sub-components ────────────────────────────────────────────────────────

function BatchTimingTable({ timings, discoverMs = null }) {
  const sorted = [...timings].sort((a, b) => a.index - b.index);
  const valid = sorted.filter((t) => typeof t.elapsedMs === "number");
  const total = valid.reduce((s, t) => s + t.elapsedMs, 0);
  const slowest = valid.length
    ? valid.reduce((m, t) => (t.elapsedMs > m.elapsedMs ? t : m))
    : null;
  const avg = valid.length ? total / valid.length : null;
  const grandTotal = total + (discoverMs ?? 0);

  return (
    <div className="mb-6 text-left">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-widest text-subtle font-semibold">
          Per-batch wall-clock
        </p>
        <p className="text-[11px] text-subtle">
          Slowest {fmtSeconds(slowest?.elapsedMs)} · avg {fmtSeconds(avg)} · total {fmtSeconds(grandTotal)}
        </p>
      </div>
      {discoverMs != null && (
        <div className={`rounded-lg px-2.5 py-1.5 mb-1.5 text-[11px] flex items-center justify-between font-mono tabular-nums ${batchToneClass(discoverMs)}`}>
          <span className="uppercase tracking-wide">Setup (download + plan)</span>
          <span className="font-semibold">{fmtSeconds(discoverMs)}</span>
        </div>
      )}
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {sorted.map((t) => (
          <li
            key={t.index}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] flex items-center justify-between font-mono tabular-nums ${batchToneClass(t.elapsedMs)}`}>
            <span>p.{t.startPage}–{t.endPage}</span>
            <span className="font-semibold">{fmtSeconds(t.elapsedMs)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-subtle mt-2">
        Vercel Hobby kills any single request at 60 s. Green &lt; 30 s · amber 30–50 s · red ≥ 50 s.
      </p>
    </div>
  );
}

function fmtSeconds(ms) {
  if (ms == null) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

function batchToneClass(ms) {
  // Hobby plan caps each request at 60s. Color thresholds tell the user at
  // a glance which batches are getting uncomfortably close.
  if (ms == null) return "bg-surface-muted text-subtle";
  if (ms >= 50_000) return "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400";
  if (ms >= 30_000) return "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400";
}

function StartParseScreen({ mode, onStart, parsing, progress, draft, batchTimings = [], discoverMs = null }) {
  const isResume = mode === "resume";
  const totalBatches = progress?.totalBatches ?? draft?.batchPlan?.length ?? null;
  const totalPages = progress?.totalPages ?? draft?.totalPages ?? null;
  const completedBatches = progress
    ? progress.batchIndex + 1
    : draft?.markdownBatches?.length ?? 0;
  const completedPages = progress
    ? progress.endPage
    : (draft?.markdownBatches || []).reduce((m, b) => Math.max(m, b.endPage || 0), 0);
  const pagePct = totalPages ? Math.min(100, (completedPages / totalPages) * 100) : 0;

  const title = isResume ? "Resume migration" : "No draft yet";
  const blurb = isResume
    ? "This rulebook was being parsed and the run was interrupted. Pick up where it left off — already-parsed batches are preserved."
    : "Parse the rulebook PDF with Gemini, then review the proposed chunks before committing to Pinecone. Large rulebooks are processed in page-range batches that each fit within Vercel's 60 s function limit.";
  const buttonLabel = isResume ? "Resume parsing" : "Start parsing";

  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/boardgames/migrate"
            className="text-subtle hover:text-foreground transition-colors text-sm inline-flex items-center gap-1">
            <MdArrowBack size={16} /> Back to list
          </Link>
        </div>

        <div className="bg-surface rounded-2xl p-8 border border-border-muted shadow-sm text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-sm text-muted mb-6">{blurb}</p>

          {parsing && progress ? (
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-foreground">
                Batch {Math.min(progress.batchIndex + 1, totalBatches || progress.batchIndex + 1)} of {totalBatches ?? "?"} — page {progress.endPage} of {totalPages ?? "?"}
              </p>
              <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${pagePct}%` }}
                />
              </div>
              <p className="text-[11px] text-subtle">
                Don't close this tab — progress is also persisted so you can resume if you do.
              </p>
            </div>
          ) : isResume && totalBatches != null ? (
            <div className="space-y-3 mb-6">
              <p className="text-sm text-foreground">
                {completedBatches} of {totalBatches} batches done · {completedPages} of {totalPages} pages parsed
              </p>
              <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${pagePct}%` }}
                />
              </div>
            </div>
          ) : null}

          {(discoverMs != null || batchTimings.length > 0) && (
            <BatchTimingTable timings={batchTimings} discoverMs={discoverMs} />
          )}

          <button
            type="button"
            onClick={onStart}
            disabled={parsing}
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-fg hover:bg-primary-hover disabled:opacity-50 transition-all shadow-sm inline-flex items-center gap-2">
            {parsing ? (
              <>
                <Loader width="0.9rem" /> Parsing…
              </>
            ) : (
              <>
                <MdPlayArrow size={16} /> {buttonLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }) {
  const colors = {
    neutral: "bg-surface text-foreground",
    green: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  };
  return (
    <div className={`rounded-xl border border-border-muted p-3 ${colors[tone]}`}>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wide font-medium opacity-70">{label}</div>
    </div>
  );
}

function BulkButton({ children, onClick, tone = "neutral", disabled = false }) {
  const colors = {
    neutral: "border-border bg-surface hover:bg-surface-muted text-foreground",
    amber: "border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/15 text-amber-700 dark:text-amber-400",
    red: "border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/15 text-red-700 dark:text-red-400",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${colors[tone]}`}>
      {children}
    </button>
  );
}

function ChunkRow({ chunk, index, onChange, onRevert }) {
  const dimmed = !chunk.accepted;
  const isVariant = chunk.scope === "variant";
  const isLegend = chunk.chunkType === "legend";

  const typeBadgeClass = isLegend
    ? "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400"
    : chunk.chunkType === "table"
      ? "bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400"
      : chunk.chunkType === "list"
        ? "bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-400"
        : "bg-surface-muted text-subtle";

  return (
    <div
      className={`rounded-2xl border bg-surface shadow-sm transition-opacity ${
        dimmed
          ? "border-border-muted opacity-50"
          : isVariant
            ? "border-amber-300 dark:border-amber-500/30"
            : "border-border-muted"
      }`}>
      {/* Header strip */}
      <div className="flex items-start gap-2 px-3 py-2 border-b border-border-muted flex-wrap">
        <div className="text-[11px] text-subtle font-mono tabular-nums">#{index + 1}</div>
        <div className="flex-1 min-w-0 text-xs text-foreground font-medium truncate">
          {chunk.breadcrumb || (
            <span className="text-subtle italic">No section</span>
          )}
        </div>
        {chunk.page != null && (
          <span className="text-[11px] text-subtle">p.{chunk.page}</span>
        )}
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeBadgeClass}`}>
          {chunk.chunkType}
        </span>
        {isVariant && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
            Variant{chunk.variantName ? `: ${chunk.variantName}` : ""}
          </span>
        )}
        {chunk.edited && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 inline-flex items-center gap-0.5">
            <MdEdit size={9} /> edited
          </span>
        )}
        {chunk.flags?.map((f) => (
          <span
            key={f}
            title={f}
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5 ${
              FLAG_TONE[f] === "red"
                ? "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400"
                : "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400"
            }`}>
            <MdWarningAmber size={9} /> {FLAG_LABELS[f] || f}
          </span>
        ))}
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <textarea
          value={chunk.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={Math.min(8, Math.max(3, Math.ceil(chunk.text.length / 80)))}
          wrap="soft"
          className="w-full text-xs font-mono leading-relaxed bg-surface text-foreground border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y break-words"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-end gap-2 px-3 pb-2">
        {chunk.edited && (
          <button
            type="button"
            onClick={onRevert}
            className="text-[11px] text-subtle hover:text-foreground inline-flex items-center gap-0.5">
            <MdRestore size={12} /> revert
          </button>
        )}
        <button
          type="button"
          onClick={() => onChange({ accepted: !chunk.accepted })}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
            chunk.accepted
              ? "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20"
              : "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20"
          }`}>
          {chunk.accepted ? (
            <>
              <MdCheck size={12} /> Accepted
            </>
          ) : (
            <>
              <MdClose size={12} /> Rejected
            </>
          )}
        </button>
      </div>
    </div>
  );
}
