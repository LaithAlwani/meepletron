"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MdSearch,
  MdRefresh,
  MdArrowForward,
  MdCheckCircle,
  MdHourglassEmpty,
  MdDescription,
} from "react-icons/md";
import Loader from "@/components/Loader";

const FILTERS = [
  { value: "pending", label: "Needs migration" },
  { value: "migrated", label: "Migrated (v2)" },
  { value: "all", label: "All" },
];

const KINDS = [
  { value: "all", label: "Base + Expansions" },
  { value: "boardgame", label: "Base only" },
  { value: "expansion", label: "Expansions only" },
];

export default function MigrateListPage() {
  const [filter, setFilter] = useState("pending");
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [filter, kind, q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = new URL("/api/admin/migrate-game/list", window.location.origin);
    url.searchParams.set("filter", filter);
    url.searchParams.set("kind", kind);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "30");
    if (q) url.searchParams.set("q", q);

    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        setData(res.data || []);
        setTotal(res.total || 0);
        setHasMore(!!res.hasMore);
      })
      .catch((err) => console.error(err))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [filter, kind, q, page]);

  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/boardgames"
            className="text-subtle hover:text-foreground transition-colors text-sm">
            ← Back
          </Link>
          <span className="text-border">/</span>
          <h1 className="text-2xl font-bold text-foreground">Migration</h1>
        </div>

        <p className="text-sm text-muted mb-6 max-w-2xl">
          Re-parse rulebooks with the new semantic chunker. Each game is
          processed individually so you can review the proposed chunks before
          they're committed to Pinecone.
        </p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <MdSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
              size={18}
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title…"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-surface text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        {/* Summary */}
        <p className="text-xs text-subtle mb-3 tabular-nums">
          {loading ? "Loading…" : `${total} games matching filters`}
        </p>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader width="4rem" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-subtle">
            No games match these filters.
          </div>
        ) : (
          <ul className="space-y-2">
            {data.map((g) => (
              <GameRow key={g._id} game={g} />
            ))}
          </ul>
        )}

        {/* Pagination */}
        {(page > 1 || hasMore) && !loading && (
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm border border-border bg-surface hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ← Previous
            </button>
            <span className="text-xs text-subtle">Page {page}</span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="px-3 py-1.5 rounded-lg text-sm border border-border bg-surface hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GameRow({ game }) {
  const isV2 = game.embed_version === 2;
  const isParsing = game.draft_status === "parsing";
  const hasDraft = game.draft_status === "parsed" || game.draft_status === "reviewing";
  const isDraftCommitted = game.draft_status === "committed";

  let badge;
  if (isV2) {
    badge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 text-[11px] font-medium">
        <MdCheckCircle size={12} /> v2
      </span>
    );
  } else if (isParsing) {
    badge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 text-[11px] font-medium">
        <MdHourglassEmpty size={12} /> Parsing in progress
      </span>
    );
  } else if (hasDraft) {
    badge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] font-medium">
        <MdHourglassEmpty size={12} /> Draft ({game.draft_chunk_count} chunks)
      </span>
    );
  } else {
    badge = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-subtle text-[11px] font-medium">
        v1
      </span>
    );
  }

  const actionLabel = isParsing
    ? "Resume migration"
    : hasDraft
      ? "Review draft"
      : isV2
        ? "Re-migrate"
        : "Start migration";

  const disabled = !game.has_pdf;

  return (
    <li className="flex items-center gap-3 p-3 bg-surface rounded-2xl border border-border-muted hover:border-primary/30 transition-colors">
      {game.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.thumbnail}
          alt={game.title}
          className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-surface-muted shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="capitalize font-semibold text-sm text-foreground truncate">
            {game.title}
          </h3>
          {game.bg_kind === "expansion" && (
            <span className="text-[11px] uppercase tracking-wide text-subtle font-medium">
              Expansion
            </span>
          )}
          {badge}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-subtle">
          {game.has_pdf ? (
            <span className="inline-flex items-center gap-1">
              <MdDescription size={12} /> Has PDF
            </span>
          ) : (
            <span className="text-red-500 dark:text-red-400">No PDF — upload one first</span>
          )}
          {isDraftCommitted && game.draft_committed_at && (
            <span>
              · committed {new Date(game.draft_committed_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {disabled ? (
          <span className="px-3 py-1.5 rounded-lg text-xs text-subtle bg-surface-muted">
            No PDF
          </span>
        ) : (
          <Link
            href={`/admin/boardgames/migrate/${game._id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-fg hover:bg-primary-hover transition-colors">
            {actionLabel}
            <MdArrowForward size={14} />
          </Link>
        )}
      </div>
    </li>
  );
}
