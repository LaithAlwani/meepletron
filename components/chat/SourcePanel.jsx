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
                  showTitle={gameIds.length > 1}
                />
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SourceBlock({ state, expandedChunks, onToggleChunk, query, onlyVariants, showTitle = true }) {
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
  const filtered = useFilteredChunks(chunks, query, onlyVariants, game?.title);
  const sections = useMemo(() => groupBySection(filtered), [filtered]);

  return (
    <div className="border-b border-border-muted last:border-b-0">
      {(showTitle || filtered.length > 0) && (
        <div className="px-4 py-3 bg-surface-muted/40">
          {showTitle && (
            <p className="text-xs font-semibold text-foreground capitalize">{game.title}</p>
          )}
          <p className="text-[10px] text-subtle">{filtered.length} of {chunks.length} sections</p>
        </div>
      )}
      <div>
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-subtle">No matching sections</p>
        )}
        {sections.map((sec) => (
          <SectionGroup
            key={sec.section}
            section={sec}
            expandedChunks={expandedChunks}
            onToggleChunk={onToggleChunk}
            gameTitle={game?.title}
          />
        ))}
      </div>
    </div>
  );
}

// Strip the leading game-title segment from a breadcrumb. New chunker output
// already omits this, but legacy v2 chunks committed before the chunker fix
// still have "Catan > Setup > Initial placement" — trim the title client-side
// so the TOC reads cleanly without re-migrating.
function stripGameTitleFromBreadcrumb(breadcrumb, gameTitle) {
  if (!breadcrumb || !gameTitle) return breadcrumb || "";
  const parts = breadcrumb.split(" > ");
  if (parts[0]?.trim().toLowerCase() === gameTitle.trim().toLowerCase()) {
    return parts.slice(1).join(" > ");
  }
  return breadcrumb;
}

function useFilteredChunks(chunks, query, onlyVariants, gameTitle) {
  return useMemo(() => {
    let out = chunks.map((c) => ({
      ...c,
      breadcrumb: stripGameTitleFromBreadcrumb(c.breadcrumb, gameTitle),
    }));
    if (onlyVariants) out = out.filter((c) => c.scope === "variant");
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (c) =>
          (c.breadcrumb || "").toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q) ||
          c.text.toLowerCase().includes(q),
      );
    }
    return out;
  }, [chunks, query, onlyVariants, gameTitle]);
}

// Bucket chunks by their first breadcrumb segment so the panel reads like a
// rulebook's table of contents: top-level sections (Setup, Combat, Scoring)
// each contain their sub-sections.
function groupBySection(chunks) {
  const order = [];
  const map = new Map();
  for (const c of chunks) {
    const parts = (c.breadcrumb || "").split(" > ").filter(Boolean);
    // Sentinel for chunks with no breadcrumb at all — `SectionGroup` resolves
    // this to the game title at render time so the header reads meaningfully.
    const section = parts[0] || "__untitled__";
    const subPath = parts.slice(1).join(" > ");
    if (!map.has(section)) {
      map.set(section, { section, items: [], firstPage: null });
      order.push(section);
    }
    const group = map.get(section);
    group.items.push({ ...c, subPath });
    if (c.page != null && (group.firstPage == null || c.page < group.firstPage)) {
      group.firstPage = c.page;
    }
  }
  return order.map((k) => map.get(k));
}

// One TOC section: bold uppercase header on top, indented chunk rows below.
// The header summarises the section (page where it starts) so the panel
// reads like a paper rulebook's table of contents.
function SectionGroup({ section, expandedChunks, onToggleChunk, gameTitle }) {
  // If a chunk has no breadcrumb at all it lands here as a placeholder section
  // — show the game title instead so the row reads "Catan · p.3" rather than
  // a meaningless "General".
  const headerLabel = section.section === "__untitled__"
    ? (gameTitle || "Untitled")
    : section.section;

  return (
    <div className="border-b border-border-muted/60 last:border-b-0">
      <div className="flex items-baseline justify-between gap-2 px-4 pt-4 pb-1.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground truncate">
          {headerLabel}
        </h4>
        {section.firstPage != null && (
          <span className="text-[10px] text-subtle font-mono tabular-nums">
            p.{section.firstPage}
          </span>
        )}
      </div>
      <div>
        {section.items.map((c) => (
          <ChunkLeaf
            key={c.chunkId}
            chunk={c}
            isExpanded={expandedChunks.has(c.chunkId)}
            onToggle={() => onToggleChunk(c.chunkId)}
            gameTitle={gameTitle}
          />
        ))}
      </div>
    </div>
  );
}

function ChunkLeaf({ chunk, isExpanded, onToggle, gameTitle }) {
  const Icon = ICONS_BY_TYPE[chunk.chunkType] || MdShortText;
  const isVariant = chunk.scope === "variant";
  // Prefer the rest-of-breadcrumb after the section header; fall back to the
  // section name itself if this chunk is the only one in its section; final
  // fallback to the game title so a no-breadcrumb chunk still reads as
  // "Catan · p.3" instead of "(untitled)".
  const label = chunk.subPath || chunk.breadcrumb || gameTitle || "(untitled)";

  return (
    <div id={`source-chunk-${chunk.chunkId}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full text-left pl-6 pr-4 py-1.5 flex items-start gap-2 hover:bg-surface-muted/60 transition-colors ${
          isVariant ? "bg-amber-50/40 dark:bg-amber-500/5" : ""
        }`}>
        <span className="mt-0.5 text-subtle shrink-0">
          {isExpanded ? <IoChevronDown size={11} /> : <IoChevronForward size={11} />}
        </span>
        <Icon size={13} className={`mt-0.5 shrink-0 ${isVariant ? "text-amber-600 dark:text-amber-400" : "text-subtle"}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0 flex items-baseline gap-1.5 flex-wrap">
              <p className="text-xs text-foreground truncate">{label}</p>
              {isVariant && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold">
                  Variant
                </span>
              )}
            </div>
            {chunk.page != null && (
              <span className="text-[10px] text-subtle font-mono tabular-nums shrink-0">
                p.{chunk.page}
              </span>
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
            <div className="pl-12 pr-4 pb-3">
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
