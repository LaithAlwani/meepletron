"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MdOutlineMessage, MdSmartToy, MdThumbUp, MdMenuBook, MdStorage, MdOutlineHelpOutline } from "react-icons/md";

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Admin</p>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <StatCard icon={<MdStorage size={22} />} label="All Messages" value={stats?.total} loading={loading} color="slate" />
          <StatCard icon={<MdOutlineMessage size={22} />} label="By Users" value={stats?.userMessages} loading={loading} color="blue" />
          <StatCard icon={<MdSmartToy size={22} />} label="By AI" value={stats?.aiMessages} loading={loading} color="violet" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-10">
          <StatCard
            icon={<MdThumbUp size={22} />}
            label="Correct Rating"
            value={
              stats
                ? stats.correctRatings + stats.wrongRatings > 0
                  ? `${Math.round((stats.correctRatings / (stats.correctRatings + stats.wrongRatings)) * 100)}%`
                  : "N/A"
                : undefined
            }
            loading={loading}
            color="green"
          />
          <StatCard
            icon={<MdOutlineHelpOutline size={22} />}
            label="Unrated AI Messages"
            value={stats?.unratedAI}
            sub={stats?.aiMessages > 0 ? `${Math.round((stats.unratedAI / stats.aiMessages) * 100)}% of AI responses` : null}
            loading={loading}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/boardgames"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border-muted shadow-sm hover:shadow-md hover:border-primary/40 transition-all">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
              <MdMenuBook size={22} />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Board Games</p>
              <p className="text-xs text-subtle mt-0.5">Add, edit and manage games</p>
            </div>
          </Link>
        </div>

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
    amber:  "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-surface border border-border-muted shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-16 rounded-lg bg-border animate-pulse" />
          <div className="h-3 w-24 rounded bg-border animate-pulse" />
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {typeof value === "string" ? value : (value?.toLocaleString() ?? "—")}
          </p>
          {sub && <p className="text-xs text-subtle mt-0.5 tabular-nums">{sub}</p>}
        </div>
      )}
      <p className="text-xs text-subtle leading-tight">{label}</p>
    </div>
  );
}
