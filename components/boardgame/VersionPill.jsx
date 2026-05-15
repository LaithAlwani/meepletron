"use client";
import { useUser } from "@clerk/nextjs";

// Small badge that surfaces a game's RAG pipeline version on the board game
// list and cards.
//
//   v2 (emerald) — visible to EVERYONE. Signals that the game has been
//                   updated to the new AI engine (semantic chunks, better
//                   answers). Acts as a "this works well" indicator.
//   v1 (amber)   — visible ONLY to admins. Signals "still needs to be run
//                   through the migration tool." Regular users don't need
//                   to know about the legacy engine — for them, the absence
//                   of a v2 badge already means "not yet upgraded."
export default function VersionPill({ embedVersion, className = "" }) {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const isV2 = embedVersion === 2;

  // Non-admin viewers only see the positive v2 signal; legacy v1 is hidden.
  if (!isV2 && !isAdmin) return null;

  const label = isV2 ? "v2" : "v1";
  const tone = isV2
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
    : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400";
  const title = isV2
    ? "Updated to the new AI engine"
    : "Legacy engine — run through the migration tool";

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${tone} ${className}`}
      title={title}
    >
      {label}
    </span>
  );
}
