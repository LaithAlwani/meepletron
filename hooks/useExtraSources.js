"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "meepletron_active_sources_";

// State + localStorage persistence for which expansion sources are checked
// on top of the base game. Pruned on load so stale ids (e.g. an expansion
// the admin removed) don't linger.
export function useExtraSources(boardgame) {
  const [extraSourceIds, setExtraSourceIds] = useState([]);

  useEffect(() => {
    if (!boardgame?._id) return;
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${boardgame._id}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const expansionIds = new Set((boardgame.expansions || []).map((e) => e._id));
      setExtraSourceIds(parsed.filter((id) => expansionIds.has(id)));
    } catch {}
  }, [boardgame?._id]);

  useEffect(() => {
    if (!boardgame?._id) return;
    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${boardgame._id}`,
        JSON.stringify(extraSourceIds),
      );
    } catch {}
  }, [extraSourceIds, boardgame?._id]);

  const toggleExtraSource = (id) =>
    setExtraSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return { extraSourceIds, toggleExtraSource };
}
