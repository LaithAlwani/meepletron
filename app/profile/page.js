"use client";
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";
import ProfileSkeleton from "@/components/ProfileSkeleton";
import { motion } from "motion/react";
import {
  MdOutlineMessage, MdSmartToy, MdThumbUp, MdOutlineChat,
  MdLogout, MdOutlineCalendarToday, MdEdit, MdCheck, MdClose,
} from "react-icons/md";
import { StatCard } from "@/components/ui";

export default function ProfilePage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

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

  const mongoUser = stats?.user;
  const fullName = mongoUser
    ? [mongoUser.first_name, mongoUser.last_name].filter(Boolean).join(" ") || mongoUser.username || "—"
    : "—";
  const initial = mongoUser?.first_name?.[0] ?? mongoUser?.username?.[0] ?? "?";

  const memberSince = mongoUser?.createdAt
    ? new Date(mongoUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  if (signingOut) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
        <Loader width="3rem" />
      </div>
    );
  }

  if (!isLoaded || loading || !stats) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4">
      <div className="max-w-xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-surface rounded-2xl shadow-sm border border-border-muted p-8 mb-6 flex flex-col items-center text-center"
        >
          {mongoUser?.avatar ? (
            <img
              src={clerkUser.imageUrl}
              alt={fullName}
              className="w-20 h-20 rounded-full object-cover shadow-md mb-4 ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center text-3xl font-bold text-primary mb-4">
              {initial}
            </div>
          )}

          <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
          <p className="text-sm text-subtle mt-0.5">{mongoUser?.email_address ?? "—"}</p>

          {memberSince && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-subtle">
              <MdOutlineCalendarToday size={13} />
              Member since {memberSince}
            </div>
          )}

          <button
            onClick={() => { setSigningOut(true); signOut(() => router.push("/sign-in")); }}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 transition-all"
          >
            <MdLogout size={16} />
            Sign out
          </button>
        </motion.div>

        <EditProfile
          mongoUser={stats?.user}
          loading={loading}
          onUpdated={(user) => setStats((s) => ({ ...s, user }))}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
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

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-border bg-bg text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm disabled:opacity-50";

function EditProfile({ mongoUser, loading, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", username: "" });

  useEffect(() => {
    if (!mongoUser) return;
    setForm({
      first_name: mongoUser.first_name ?? "",
      last_name: mongoUser.last_name ?? "",
      username: mongoUser.username ?? "",
    });
  }, [mongoUser]);

  const reset = () => {
    setForm({
      first_name: mongoUser?.first_name ?? "",
      last_name: mongoUser?.last_name ?? "",
      username: mongoUser?.username ?? "",
    });
    setEditing(false);
  };

  const isDirty =
    form.first_name !== (mongoUser?.first_name ?? "") ||
    form.last_name !== (mongoUser?.last_name ?? "") ||
    form.username !== (mongoUser?.username ?? "");

  const handleSave = async () => {
    if (!isDirty) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update");
      onUpdated?.(json.data);
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !mongoUser) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="bg-surface rounded-2xl shadow-sm border border-border-muted p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-subtle font-semibold">Personal Info</p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <MdEdit size={14} />
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">First name</label>
          {editing ? (
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              disabled={saving}
              placeholder="—"
              className={inputCls}
            />
          ) : (
            <p className="text-sm text-foreground py-2">{mongoUser?.first_name || <span className="text-subtle">—</span>}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">Last name</label>
          {editing ? (
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              disabled={saving}
              placeholder="—"
              className={inputCls}
            />
          ) : (
            <p className="text-sm text-foreground py-2">{mongoUser?.last_name || <span className="text-subtle">—</span>}</p>
          )}
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-medium text-muted">Username</label>
          {editing ? (
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              disabled={saving}
              placeholder="—"
              className={inputCls}
            />
          ) : (
            <p className="text-sm text-foreground py-2">{mongoUser?.username || <span className="text-subtle">—</span>}</p>
          )}
        </div>
      </div>

      {editing && (
        <div className="flex items-center gap-2 mt-4 justify-end">
          <button
            onClick={reset}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-muted hover:bg-surface-muted transition-colors disabled:opacity-50"
          >
            <MdClose size={14} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-fg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader width="0.8rem" /> : <MdCheck size={14} />}
            Save
          </button>
        </div>
      )}
    </motion.div>
  );
}
