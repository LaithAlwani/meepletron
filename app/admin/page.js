"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MdOutlineMessage, MdSmartToy, MdThumbUp, MdMenuBook, MdStorage, MdOutlineHelpOutline, MdPeople, MdSearch, MdTune } from "react-icons/md";
import { StatCard } from "@/components/ui";

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
          <StatCard icon={<MdStorage size={22} />} label="All Messages" value={stats?.total} loading={loading} color="slate" size="lg" />
          <StatCard icon={<MdOutlineMessage size={22} />} label="By Users" value={stats?.userMessages} loading={loading} color="blue" size="lg" />
          <StatCard icon={<MdSmartToy size={22} />} label="By AI" value={stats?.aiMessages} loading={loading} color="violet" size="lg" />
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
            size="lg"
          />
          <StatCard
            icon={<MdOutlineHelpOutline size={22} />}
            label="Unrated AI Messages"
            value={stats?.unratedAI}
            sub={stats?.aiMessages > 0 ? `${Math.round((stats.unratedAI / stats.aiMessages) * 100)}% of AI responses` : null}
            loading={loading}
            color="amber"
            size="lg"
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
          <Link
            href="/admin/users"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border-muted shadow-sm hover:shadow-md hover:border-primary/40 transition-all">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
              <MdPeople size={22} />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Users</p>
              <p className="text-xs text-subtle mt-0.5">View users and their activity</p>
            </div>
          </Link>
          <Link
            href="/admin/searches"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border-muted shadow-sm hover:shadow-md hover:border-primary/40 transition-all">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
              <MdSearch size={22} />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Searches</p>
              <p className="text-xs text-subtle mt-0.5">See what users are searching for</p>
            </div>
          </Link>
          <Link
            href="/admin/site-config"
            className="group flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border-muted shadow-sm hover:shadow-md hover:border-primary/40 transition-all">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
              <MdTune size={22} />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Site Config</p>
              <p className="text-xs text-subtle mt-0.5">Tune RAG knobs · monthly token usage</p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
