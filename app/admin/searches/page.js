"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";
import { MdDelete, MdArrowDropUp, MdArrowDropDown, MdSearch } from "react-icons/md";

const DEFAULT_DIRECTIONS = {
  count: "desc",
  query: "asc",
  updatedAt: "desc",
};

export default function AdminSearchesPage() {
  const [searches, setSearches] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [primarySort, setPrimarySort] = useState("count");
  const [directions, setDirections] = useState(DEFAULT_DIRECTIONS);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const generationRef = useRef(0);
  const sentinelRef = useRef(null);
  const primarySortRef = useRef("count");
  const directionsRef = useRef(DEFAULT_DIRECTIONS);

  const fetchPage = useCallback(async (page) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const gen = generationRef.current;
    setLoading(true);
    try {
      const by = primarySortRef.current;
      const dir = directionsRef.current[by];
      const res = await fetch(`/api/admin/searches?page=${page}&sortBy=${by}&sortDir=${dir}`);
      const { data, hasMore: more, total: t } = await res.json();
      if (gen !== generationRef.current) return;
      setSearches((prev) => (page === 1 ? data : [...prev, ...data]));
      setHasMore(more);
      setTotal(t);
    } finally {
      if (gen === generationRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current) {
          pageRef.current += 1;
          fetchPage(pageRef.current);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, fetchPage, searches.length]);

  const handleSort = (field) => {
    const newDir = directionsRef.current[field] === "asc" ? "desc" : "asc";
    const newDirections = { ...directionsRef.current, [field]: newDir };

    directionsRef.current = newDirections;
    primarySortRef.current = field;
    generationRef.current += 1;

    setDirections(newDirections);
    setPrimarySort(field);
    setSearches([]);
    setHasMore(true);
    pageRef.current = 1;
    loadingRef.current = false;
    fetchPage(1);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/searches?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSearches((prev) => prev.filter((s) => s._id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch {
      toast.error("Failed to delete search");
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const res = await fetch(`/api/admin/searches?all=true`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSearches([]);
      setTotal(0);
      setHasMore(false);
      pageRef.current = 1;
    } catch {
      toast.error("Failed to delete all searches");
    } finally {
      setDeletingAll(false);
      setConfirmingAll(false);
    }
  };

  const isInitialLoad = loading && searches.length === 0;

  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-8 flex items-center gap-3">
          <Link href="/admin" className="text-subtle hover:text-foreground transition-colors text-sm">
            ← Back
          </Link>
          <span className="text-border">/</span>
          <h1 className="text-2xl font-bold text-foreground">
            Searches
            {total > 0 && (
              <span className="ml-2 text-base font-normal text-subtle">({total})</span>
            )}
          </h1>
        </div>

        <div className="flex items-start justify-between gap-4 mb-6">
          <p className="text-sm text-muted flex-1">
            What users are searching for. High-count terms with no game in your library are good candidates to add.
          </p>
          {searches.length > 0 && (
            confirmingAll ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setConfirmingAll(false)}
                  disabled={deletingAll}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-muted hover:bg-surface-muted transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                  {deletingAll ? "Deleting…" : "Delete All"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingAll(true)}
                className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border text-muted hover:border-red-500/40 hover:text-red-500 transition-colors">
                Delete All
              </button>
            )
          )}
        </div>

        {isInitialLoad ? (
          <div className="flex justify-center py-16">
            <Loader width="1.5rem" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-border">
              <div className="flex-1 min-w-0">
                <SortBtn field="query" label="Query" primary={primarySort} dirs={directions} onSort={handleSort} />
              </div>
              <div className="flex items-center gap-5 shrink-0">
                <div className="w-24 flex justify-end">
                  <SortBtn field="updatedAt" label="Last Searched" primary={primarySort} dirs={directions} onSort={handleSort} />
                </div>
                <div className="w-12 flex justify-end">
                  <SortBtn field="count" label="Count" primary={primarySort} dirs={directions} onSort={handleSort} />
                </div>
                <div className="w-8" />
              </div>
            </div>

            {searches.length === 0 && !loading ? (
              <p className="text-center text-subtle py-16">No searches recorded yet.</p>
            ) : (
              <div className="divide-y divide-border-muted">
                {searches.map((s) => (
                  <SearchRow
                    key={s._id}
                    search={s}
                    onDelete={() => handleDelete(s._id)}
                  />
                ))}
              </div>
            )}

            {hasMore && <div ref={sentinelRef} className="h-8" />}
            {loading && searches.length > 0 && (
              <div className="flex justify-center py-6">
                <Loader width="1.2rem" />
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

function SortBtn({ field, label, primary, dirs, onSort, className = "" }) {
  const isActive = primary === field;
  const isAsc = dirs[field] === "asc";
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center whitespace-nowrap text-xs font-medium uppercase tracking-wide transition-colors ${
        isActive ? "text-primary" : "text-subtle hover:text-foreground"
      } ${className}`}
    >
      {label}
      {isActive && (
        isAsc ? <MdArrowDropUp size={16} /> : <MdArrowDropDown size={16} />
      )}
    </button>
  );
}

function SearchRow({ search, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const lastSearched = new Date(search.updatedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <MdSearch size={16} className="text-subtle shrink-0" />
        <p className="text-sm text-foreground truncate">{search.query}</p>
      </div>
      <div className="flex items-center gap-5 shrink-0">
        <div className="w-24 text-right">
          <p className="text-xs text-muted tabular-nums">{lastSearched}</p>
        </div>
        <div className="w-12 text-right">
          <p className="text-sm text-foreground tabular-nums font-medium">{search.count}</p>
        </div>
        <div className="flex justify-end">
          {confirming ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setConfirming(false)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-muted hover:bg-surface-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { setConfirming(false); onDelete(); }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="p-2 rounded-xl text-border hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all"
              aria-label="Delete search"
            >
              <MdDelete size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
