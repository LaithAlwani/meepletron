"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Loader from "@/components/Loader";
import { MdPerson } from "react-icons/md";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  const fetchPage = useCallback(async (page) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}`);
      const { data, hasMore: more } = await res.json();
      setUsers((prev) => (page === 1 ? data : [...prev, ...data]));
      setHasMore(more);
    } finally {
      loadingRef.current = false;
      setLoading(false);
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
  }, [hasMore, fetchPage]);

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
        ) : users.length === 0 ? (
          <p className="text-center text-subtle py-16">No users yet.</p>
        ) : (
          <>
            {/* Header row */}
            <div className="flex items-center gap-4 pb-2 mb-1 border-b border-border">
              <div className="w-10 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-subtle font-medium uppercase tracking-wide">User</p>
              </div>
              <div className="flex items-center gap-5 shrink-0 text-right">
                <p className="text-xs text-subtle font-medium uppercase tracking-wide w-20">Last Active</p>
                <p className="text-xs text-subtle font-medium uppercase tracking-wide w-10">Chats</p>
                <p className="text-xs text-subtle font-medium uppercase tracking-wide w-16">Messages</p>
              </div>
            </div>

            <div className="divide-y divide-border-muted">
              {users.map((user) => (
                <UserRow key={user._id} user={user} />
              ))}
            </div>

            {hasMore && <div ref={sentinelRef} className="h-8" />}
            {loading && (
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
    <div className="flex items-center gap-4 py-3.5">
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
        <div className="w-20 flex flex-col items-center justify-center">
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
    </div>
  );
}
