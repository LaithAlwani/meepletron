"use client";
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  MdOutlineMessage, MdSmartToy, MdThumbUp, MdOutlineChat,
  MdLogout, MdOutlineCalendarToday,
} from "react-icons/md";

export default function ProfilePage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) { router.replace("/sign-in"); return; }
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, [isLoaded, clerkUser]);

  const ratingPct = stats
    ? stats.correctRatings + stats.wrongRatings > 0
      ? Math.round((stats.correctRatings / (stats.correctRatings + stats.wrongRatings)) * 100)
      : null
    : null;

  const memberSince = stats?.user?.createdAt
    ? new Date(stats.user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4">
      <div className="max-w-xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-surface rounded-2xl shadow-sm border border-border-muted p-8 mb-6 flex flex-col items-center text-center"
        >
          {clerkUser?.imageUrl ? (
            <img
              src={clerkUser.imageUrl}
              alt={clerkUser.fullName}
              className="w-20 h-20 rounded-full object-cover shadow-md mb-4 ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center text-3xl font-bold text-primary mb-4">
              {clerkUser?.firstName?.[0] ?? "?"}
            </div>
          )}

          <h1 className="text-xl font-bold text-foreground">{clerkUser?.fullName ?? "—"}</h1>
          <p className="text-sm text-subtle mt-0.5">{clerkUser?.primaryEmailAddress?.emailAddress ?? "—"}</p>

          {memberSince && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-subtle">
              <MdOutlineCalendarToday size={13} />
              Member since {memberSince}
            </div>
          )}

          <button
            onClick={() => signOut(() => router.push("/"))}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 transition-all"
          >
            <MdLogout size={16} />
            Sign out
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <p className="text-xs uppercase tracking-widest text-subtle font-semibold mb-3 px-1">Activity</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<MdOutlineChat size={20} />} label="Total Chats" value={stats?.totalChats} loading={loading} color="blue" />
            <StatCard icon={<MdOutlineMessage size={20} />} label="Messages Sent" value={stats?.userMessages} loading={loading} color="violet" />
            <StatCard icon={<MdSmartToy size={20} />} label="AI Responses" value={stats?.aiMessages} loading={loading} color="slate" />
            <StatCard
              icon={<MdThumbUp size={20} />}
              label="Rating Score"
              value={ratingPct !== null ? `${ratingPct}%` : loading ? undefined : "No ratings"}
              sub={stats && ratingPct !== null ? `${stats.correctRatings} correct · ${stats.wrongRatings} wrong` : null}
              loading={loading}
              color="green"
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, loading, color }) {
  const colors = {
    slate:  "bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-slate-300",
    blue:   "bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
    violet: "bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",
    green:  "bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400",
  };

  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-surface border border-border-muted shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      {loading ? (
        <div className="space-y-1.5">
          <div className="h-6 w-14 rounded-lg bg-border animate-pulse" />
          <div className="h-3 w-20 rounded bg-border animate-pulse" />
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {typeof value === "string" ? value : (value?.toLocaleString() ?? "—")}
          </p>
          {sub && <p className="text-xs text-subtle mt-0.5">{sub}</p>}
        </div>
      )}
      <p className="text-xs text-subtle leading-tight">{label}</p>
    </div>
  );
}
