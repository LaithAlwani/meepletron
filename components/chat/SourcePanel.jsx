"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  IoClose,
  IoChevronDown,
  IoChevronForward,
  IoBookOutline,
} from "react-icons/io5";
import { MdTableChart, MdList, MdShortText, MdInsertEmoticon, MdSearch } from "react-icons/md";
import Loader from "@/components/Loader";

const ICONS_BY_TYPE = {
  text: MdShortText,
  table: MdTableChart,
  list: MdList,
  legend: MdInsertEmoticon,
};

export default function SourcePanel({ open, onClose, gameIds, focusChunkId }) {
  const [data, setData] = useState({}); // gameId -> { game, chunks } | "error" | "loading"
  const [expandedChunks, setExpandedChunks] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [query, setQuery] = useState("");
  const [onlyVariants, setOnlyVariants] = useState(false);

  // Load TOC for each game when panel opens or game list changes
  useEffect(() => {
    if (!open || !gameIds?.length) return;
    let cancelled = false;
    gameIds.forEach((gid) => {
      if (data[gid] && data[gid] !== "error") return; // already loaded
      setData((prev) => ({ ...prev, [gid]: "loading" }));
      fetch(`/api/boardgames/${gid}/toc`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((json) => {
          if (cancelled) return;
          setData((prev) => ({ ...prev, [gid]: json.data }));
        })
        .catch((status) => {
          if (cancelled) return;
          // 404 = game not yet on v2; show empty state for that source
          setData((prev) => ({ ...prev, [gid]: status === 404 ? "v1" : "error" }));
        });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gameIds]);

  // When a citation pill jumps to a chunk, auto-expand the matching card
  useEffect(() => {
    if (!focusChunkId) return;
    setExpandedChunks((prev) => new Set(prev).add(focusChunkId));
    // Scroll into view after layout settles
    requestAnimationFrame(() => {
      const el = document.getElementById(`source-chunk-${focusChunkId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [focusChunkId]);

  const toggleChunk = (chunkId) =>
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      next.has(chunkId) ? next.delete(chunkId) : next.add(chunkId);
      return next;
    });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="src-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-30 backdrop-blur-[1px]"
          />
          <motion.aside
            key="src-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 w-full sm:w-96 h-full bg-bg z-40 shadow-2xl flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border-muted">
              <div>
                <h3 className="font-semibold text-sm text-foreground inline-flex items-center gap-1.5">
                  <IoBookOutline size={16} /> Rulebook
                </h3>
                <p className="text-xs text-subtle mt-0.5">
                  {gameIds?.length || 0} source{gameIds?.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-surface-muted transition-colors text-muted">
                <IoClose size={18} />
              </button>
            </div>

            {/* Filter bar */}
            <div className="px-4 py-3 border-b border-border-muted space-y-2">
              <div className="relative">
                <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle" size={16} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the rulebook…"
                  className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-border bg-surface text-foreground placeholder:text-subtle text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyVariants}
                  onChange={(e) => setOnlyVariants(e.target.checked)}
                  className="accent-primary"
                />
                Only show variants
              </label>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {!gameIds?.length && (
                <p className="text-center text-subtle text-sm py-12">
                  No sources active
                </p>
              )}
              {gameIds?.map((gid) => (
                <SourceBlock
                  key={gid}
                  state={data[gid]}
                  expandedChunks={expandedChunks}
                  onToggleChunk={toggleChunk}
                  query={query}
                  onlyVariants={onlyVariants}
                />
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SourceBlock({ state, expandedChunks, onToggleChunk, query, onlyVariants }) {
  if (state === "loading" || state === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Loader width="1.5rem" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <p className="text-center text-red-500 dark:text-red-400 text-xs py-6 px-4">
        Failed to load rulebook
      </p>
    );
  }
  if (state === "v1") {
    return (
      <div className="px-4 py-4 text-xs text-subtle">
        This source hasn&apos;t been migrated to v2 yet. The rulebook navigator only works for games with semantic chunks. Admin: migrate this game to enable browsing here.
      </div>
    );
  }

  const { game, chunks } = state;
  const filtered = useFilteredChunks(chunks, query, onlyVariants);

  return (
    <div className="border-b border-border-muted last:border-b-0">
      <div className="px-4 py-3 bg-surface-muted/40">
        <p className="text-xs font-semibold text-foreground capitalize">{game.title}</p>
        <p className="text-[10px] text-subtle">{filtered.length} of {chunks.length} sections</p>
      </div>
      <div className="divide-y divide-border-muted">
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-subtle">No matching sections</p>
        )}
        {filtered.map((c) => (
          <ChunkLeaf
            key={c.chunkId}
            chunk={c}
            isExpanded={expandedChunks.has(c.chunkId)}
            onToggle={() => onToggleChunk(c.chunkId)}
          />
        ))}
      </div>
    </div>
  );
}

function useFilteredChunks(chunks, query, onlyVariants) {
  return useMemo(() => {
    let out = chunks;
    if (onlyVariants) out = out.filter((c) => c.scope === "variant");
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (c) =>
          c.breadcrumb.toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q) ||
          c.text.toLowerCase().includes(q),
      );
    }
    return out;
  }, [chunks, query, onlyVariants]);
}

function ChunkLeaf({ chunk, isExpanded, onToggle }) {
  const Icon = ICONS_BY_TYPE[chunk.chunkType] || MdShortText;
  const isVariant = chunk.scope === "variant";

  return (
    <div id={`source-chunk-${chunk.chunkId}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full text-left px-4 py-2.5 flex items-start gap-2 hover:bg-surface-muted/60 transition-colors ${
          isVariant ? "bg-amber-50/40 dark:bg-amber-500/5" : ""
        }`}>
        <span className="mt-0.5 text-subtle shrink-0">
          {isExpanded ? <IoChevronDown size={12} /> : <IoChevronForward size={12} />}
        </span>
        <Icon size={14} className={`mt-0.5 shrink-0 ${isVariant ? "text-amber-600 dark:text-amber-400" : "text-subtle"}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="text-xs font-medium text-foreground truncate">
              {chunk.breadcrumb || "(untitled)"}
            </p>
            {isVariant && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold">
                Variant
              </span>
            )}
            {chunk.page != null && (
              <span className="text-[10px] text-subtle">p.{chunk.page}</span>
            )}
          </div>
          {!isExpanded && (
            <p className="text-[11px] text-muted truncate mt-0.5">{chunk.preview}</p>
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="px-10 pb-3 pr-4">
              <p className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed">
                {chunk.text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
