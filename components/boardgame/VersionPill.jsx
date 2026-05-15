"use client";
import { useUser } from "@clerk/nextjs";

// Small badge that surfaces a game's RAG pipeline version to admins so they
// can spot at a glance which games still need to be run through the v2
// migration flow. Renders nothing for non-admin viewers.
export default function VersionPill({ embedVersion, className = "" }) {
  const { user } = useUser();
  if (user?.publicMetadata?.role !== "admin") return null;

  const isV2 = embedVersion === 2;
  const label = isV2 ? "v2" : "v1";
  const tone = isV2
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
    : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400";

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${tone} ${className}`}
      title={isV2 ? "Migrated to v2 (semantic chunks)" : "Legacy v1 — run through the migration tool"}
    >
      {label}
    </span>
  );
}
