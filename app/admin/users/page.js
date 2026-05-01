"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Loader from "@/components/Loader";
import { MdPerson, MdArrowDropUp, MdArrowDropDown } from "react-icons/md";

const DEFAULT_DIRECTIONS = {
  name: "asc",
  updatedAt: "desc",
  chatCount: "desc",
  aiMessageCount: "desc",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [primarySort, setPrimarySort] = useState("updatedAt");
  const [directions, setDirections] = useState(DEFAULT_DIRECTIONS);

  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const generationRef = useRef(0);
  const sentinelRef = useRef(null);
  const primarySortRef = useRef("updatedAt");
  const directionsRef = useRef(DEFAULT_DIRECTIONS);

  const fetchPage = useCallback(async (page) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const gen = generationRef.current;
    setLoading(true);
    try {
      const by = primarySortRef.current;
      const dir = directionsRef.current[by];
      const nameDir = directionsRef.current.name;
      const res = await fetch(
        `/api/admin/users?page=${page}&sortBy=${by}&sortDir=${dir}&nameDir=${nameDir}`
      );
      const { data, hasMore: more } = await res.json();
      if (gen !== generationRef.current) return;
      setUsers((prev) => (page === 1 ? data : [...prev, ...data]));
      setHasMore(more);
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

  // Re-run when users.length changes so the observer attaches after the initial load
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
  }, [hasMore, fetchPage, users.length]);

  const handleSort = (field) => {
    const newDir = directionsRef.current[field] === "asc" ? "desc" : "asc";
    const newDirections = { ...directionsRef.current, [field]: newDir };

    directionsRef.current = newDirections;
    primarySortRef.current = field;
    generationRef.current += 1;

    setDirections(newDirections);
    setPrimarySort(field);
    setUsers([]);
    setHasMore(true);
    pageRef.current = 1;
    loadingRef.current = false;
    fetchPage(1);
  };

  const isInitialLoad = loading && users.length === 0;

  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-8 flex items-center gap-3">
          <Link href="/admin" className="text-subtle hover:text-foreground transition-colors text-sm">
            ← Back
          </Link>
          <span className="text-border">/</span>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
        </div>

        {isInitialLoad ? (
          <div className="flex justify-center py-16">
            <Loader width="1.5rem" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-border">
              <div className="w-12 shrink-0" />
              <div className="flex-1 min-w-0">
                <SortBtn field="name" label="User" primary={primarySort} dirs={directions} onSort={handleSort} />
              </div>
              <div className="flex items-center gap-5 shrink-0">
                <div className="w-20 flex justify-end">
                  <SortBtn field="updatedAt" label="Last Active" primary={primarySort} dirs={directions} onSort={handleSort} />
                </div>
                <div className="w-10 flex justify-end">
                  <SortBtn field="chatCount" label="Chats" primary={primarySort} dirs={directions} onSort={handleSort} />
                </div>
                <div className="w-16 flex justify-end">
                  <SortBtn field="aiMessageCount" label="Messages" primary={primarySort} dirs={directions} onSort={handleSort} />
                </div>
              </div>
            </div>

            {users.length === 0 && !loading ? (
              <p className="text-center text-subtle py-16">No users yet.</p>
            ) : (
              <div className="divide-y divide-border-muted">
                {users.map((user) => (
                  <UserRow key={user._id} user={user} />
                ))}
              </div>
            )}

            {hasMore && <div ref={sentinelRef} className="h-8" />}
            {loading && users.length > 0 && (
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

function UserRow({ user }) {
  const total = user.correctRatings + user.wrongRatings;
  const rating = total > 0 ? `${Math.round((user.correctRatings / total) * 100)}%` : "—";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Anonymous";
  const lastActive = new Date(user.updatedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const joined = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <Link
      href={`/admin/users/${user._id}`}
      className="flex items-center gap-4 py-3.5 hover:bg-surface-muted/40 -mx-2 px-2 rounded-lg transition-colors"
    >
      <div className="shrink-0">
        {user.avatar ? (
          <img src={user.avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center text-subtle">
            <MdPerson size={20} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted truncate">{user.email_address}</p>
      </div>

      <div className="flex items-center gap-5 shrink-0 text-right">
        <div className="w-20 flex flex-col items-center">
          <p className="text-xs text-foreground tabular-nums">{lastActive}</p>
          <p className="text-[10px] text-muted tabular-nums">{joined}</p>
        </div>
        <div className="w-10">
          <p className="text-sm text-foreground tabular-nums text-center">{user.chatCount}</p>
        </div>
        <div className="w-16">
          <p className="text-sm text-foreground tabular-nums text-center">
            {user.aiMessageCount}
            <span className={`text-xs ml-1 ${total > 0 ? "text-muted" : "text-subtle"}`}>
              ({rating})
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
