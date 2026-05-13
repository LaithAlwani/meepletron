"use client";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import BoardgameContainer from "./BoardgameContainer";
import { useGetBoardgames, useSearch } from "@/utils/hooks";
import { IoSearchOutline } from "react-icons/io5";
import { MdGridView, MdViewList } from "react-icons/md";

const PLAYER_OPTIONS = ["2", "3", "4", "5", "6"];
const TIME_OPTIONS = [
  { value: "quick", label: "≤30 min" },
  { value: "standard", label: "30–90 min" },
  { value: "epic", label: "90+ min" },
];
const EMPTY_FILTERS = { players: null, time: null, hasExpansions: false };

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
        active
          ? "bg-primary text-primary-fg border-primary"
          : "bg-surface text-muted border-border hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="aspect-square rounded-xl bg-border animate-pulse" />
      <div className="h-3 w-3/4 rounded bg-border animate-pulse" />
    </div>
  );
}

function SkeletonGrid({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

function SkeletonList({ count = 8 }) {
  return (
    <div className="divide-y divide-border-muted">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <div className="w-12 h-12 rounded-xl bg-border animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-border animate-pulse" />
            <div className="h-2.5 w-1/3 rounded bg-border animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BoardgameListItem({ boardgame }) {
  const { _id, slug, thumbnail, title, min_players, max_players, play_time, year } = boardgame;
  const players =
    min_players && max_players
      ? min_players === max_players
        ? `${min_players} players`
        : `${min_players}–${max_players} players`
      : null;
  const stats = [players, play_time ? `${play_time} min` : null, year]
    .filter(Boolean)
    .join(" · ");

  return (
    <a href={`/boardgames/${slug || _id}`} className="flex items-center gap-3 py-3 group">
      <img
        src={thumbnail}
        alt={title}
        className="w-12 h-12 rounded-xl object-cover object-top shrink-0 shadow-sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground capitalize truncate group-hover:text-primary transition-colors">
          {title}
        </p>
        {stats && <p className="text-xs text-muted mt-0.5">{stats}</p>}
      </div>
    </a>
  );
}

function GameGrid({ boardgames }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {boardgames.map((bg) => <BoardgameContainer key={bg._id} boardgame={bg} />)}
    </div>
  );
}

function GameList({ boardgames }) {
  return (
    <div className="divide-y divide-border-muted">
      {boardgames.map((bg) => <BoardgameListItem key={bg._id} boardgame={bg} />)}
    </div>
  );
}

function SearchResults({ results, loading, query, view }) {
  if (loading) return view === "list" ? <SkeletonList count={6} /> : <SkeletonGrid count={6} />;

  if (results?.length === 0 && query.trim()) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <IoSearchOutline size={40} className="text-border" />
        <div>
          <p className="font-semibold text-foreground">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-subtle mt-1">
            Want this game added?{" "}
            <a href="/#contact" className="underline underline-offset-2 text-primary">
              Request it here
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (!results?.length) return null;
  return view === "list" ? <GameList boardgames={results} /> : <GameGrid boardgames={results} />;
}

export default function BoardgameList() {
  const [view, setView] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("boardgames-view") === "list" ? "list" : "grid";
    }
    return "grid";
  });
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const { isLoading, isLoadingMore, boardgames, totalGames, hasMore, fetchBoardgames, error } =
    useGetBoardgames({ limit: 24, filters });

  const { query, setQuery, results, loading: searchLoading } = useSearch({ limit: 30 });
  const sentinelRef = useRef(null);

  if (error) toast.error(error);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) fetchBoardgames();
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, fetchBoardgames]);

  const isSearching = query.trim().length > 0;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const togglePlayer = (p) => setFilters((f) => ({ ...f, players: f.players === p ? null : p }));
  const toggleTime = (t) => setFilters((f) => ({ ...f, time: f.time === t ? null : t }));
  const toggleBool = (key) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-subtle font-medium mb-1">Library</p>
          <h1 className="text-3xl font-bold text-foreground">
            Board Games
            {totalGames > 0 && (
              <span className="ml-2 text-base font-normal text-subtle">({totalGames})</span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle — mobile only */}
          <button
            onClick={() => setView((v) => {
              const next = v === "grid" ? "list" : "grid";
              localStorage.setItem("boardgames-view", next);
              return next;
            })}
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-surface text-muted hover:text-foreground hover:border-primary/50 transition-all shrink-0"
            aria-label="Toggle view"
          >
            {view === "grid" ? <MdViewList size={18} /> : <MdGridView size={18} />}
          </button>

          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <IoSearchOutline
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search games…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-surface text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground text-xs font-medium transition-colors">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <span className="text-xs text-subtle font-medium shrink-0">Players</span>
        {PLAYER_OPTIONS.map((p) => (
          <FilterChip key={p} active={filters.players === p} onClick={() => togglePlayer(p)}>
            {p === "6" ? "6+" : p}
          </FilterChip>
        ))}
        <span className="w-px h-4 bg-border mx-0.5 shrink-0" />
        {TIME_OPTIONS.map(({ value, label }) => (
          <FilterChip key={value} active={filters.time === value} onClick={() => toggleTime(value)}>
            {label}
          </FilterChip>
        ))}
        <span className="w-px h-4 bg-border mx-0.5 shrink-0" />
        <FilterChip active={filters.hasExpansions} onClick={() => toggleBool("hasExpansions")}>
          Has Expansions
        </FilterChip>
        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="shrink-0 px-2 py-1 text-xs text-subtle hover:text-foreground transition-colors ml-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Content */}
      {isSearching ? (
        <SearchResults results={results} loading={searchLoading} query={query} view={view} />
      ) : isLoading ? (
        view === "list" ? <SkeletonList count={12} /> : <SkeletonGrid count={24} />
      ) : boardgames.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="font-semibold text-foreground">No games match these filters</p>
          <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-sm text-primary hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {view === "list" ? <GameList boardgames={boardgames} /> : <GameGrid boardgames={boardgames} />}

          {isLoadingMore && (
            view === "list" ? <SkeletonList count={6} /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 mt-3 md:mt-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )
          )}

          {hasMore && <div ref={sentinelRef} className="h-1" />}

          {!hasMore && boardgames.length > 0 && (
            <p className="text-center text-sm text-subtle mt-10 pb-4">
              You&apos;ve seen all {totalGames} games
            </p>
          )}
        </>
      )}
    </div>
  );
}
