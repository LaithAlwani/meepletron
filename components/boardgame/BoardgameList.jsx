"use client";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import BoardgameContainer from "./BoardgameContainer";
import { useGetBoardgames, useSearch } from "@/utils/hooks";
import { IoSearchOutline } from "react-icons/io5";
import Link from "next/link";

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

function SearchResults({ results, loading, query }) {
  if (loading) return <SkeletonGrid count={6} />;

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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
      {results.map((boardgame) => (
        <BoardgameContainer key={boardgame._id} boardgame={boardgame} />
      ))}
    </div>
  );
}

export default function BoardgameList() {
  const { isLoading, isLoadingMore, boardgames, totalGames, hasMore, fetchBoardgames, error } =
    useGetBoardgames({ limit: 24 });

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-subtle font-medium mb-1">Library</p>
          <h1 className="text-3xl font-bold text-foreground">
            Board Games
            {totalGames > 0 && (
              <span className="ml-2 text-base font-normal text-subtle">({totalGames})</span>
            )}
          </h1>
        </div>

        <div className="relative w-full sm:w-64">
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

      {isSearching ? (
        <SearchResults results={results} loading={searchLoading} query={query} />
      ) : isLoading ? (
        <SkeletonGrid count={24} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {boardgames.map((boardgame) => (
              <BoardgameContainer key={boardgame._id} boardgame={boardgame} />
            ))}
          </div>

          {isLoadingMore && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 mt-3 md:mt-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
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
