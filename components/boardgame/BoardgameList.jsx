"use client";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import BoardgameContainer from "./BoardgameContainer";
import { useGetBoardgames, useSearch } from "@/utils/hooks";
import { IoSearchOutline } from "react-icons/io5";
import Link from "next/link";
import { ImBubbles } from "react-icons/im";

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="aspect-square rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse" />
      <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" />
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

// ─── Search results ───────────────────────────────────────────────────────────

function SearchResults({ results, loading, query, onClear }) {
  if (loading) return <SkeletonGrid count={6} />;

  if (results?.length === 0 && query.trim()) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <IoSearchOutline size={40} className="text-gray-300 dark:text-slate-600" />
        <div>
          <p className="font-semibold text-gray-700 dark:text-slate-300">No results for "{query}"</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            Want this game added?{" "}
            <a href="/#contact" className="underline underline-offset-2 text-blue-600 dark:text-yellow-400">
              Request it here
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (!results?.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {results.map((boardgame) => (
        <BoardgameContainer key={boardgame._id} boardgame={boardgame} />
      ))}
    </div>
  );
}

// ─── Main list ────────────────────────────────────────────────────────────────

export default function BoardgameList() {
  const { isLoading, isLoadingMore, boardgames, totalGames, hasMore, fetchBoardgames, error } =
    useGetBoardgames({ limit: 24 });

  const { query, setQuery, results, loading: searchLoading } = useSearch({ limit: 30 });

  const sentinelRef = useRef(null);

  if (error) toast.error(error);

  // IntersectionObserver — fires when sentinel enters viewport.
  // isLoading is in deps so the observer re-attaches after the sentinel
  // remounts (it lives inside the non-skeleton branch of the ternary).
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchBoardgames();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, fetchBoardgames]);

  const isSearching = query.trim().length > 0;

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-slate-500 font-medium mb-1">
            Library
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Board Games
            {totalGames > 0 && (
              <span className="ml-2 text-base font-normal text-gray-400 dark:text-slate-500">
                ({totalGames})
              </span>
            )}
          </h1>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <IoSearchOutline
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-yellow-500 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-xs font-medium transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isSearching ? (
        <SearchResults
          results={results}
          loading={searchLoading}
          query={query}
          onClear={() => setQuery("")}
        />
      ) : isLoading ? (
        <SkeletonGrid count={24} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {boardgames.map((boardgame) => (
              <BoardgameContainer key={boardgame._id} boardgame={boardgame} />
            ))}
          </div>

          {/* Load-more skeleton while fetching next page */}
          {isLoadingMore && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 mt-3 md:mt-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Invisible sentinel — IntersectionObserver watches this */}
          {hasMore && <div ref={sentinelRef} className="h-1" />}

          {/* End of list */}
          {!hasMore && boardgames.length > 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-slate-600 mt-10 pb-4">
              You've seen all {totalGames} games
            </p>
          )}
        </>
      )}
    </div>
  );
}
