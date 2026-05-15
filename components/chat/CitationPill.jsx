"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

// Visual style by source scope:
//   base game      → neutral
//   expansion      → primary (yellow/blue depending on theme)
//   variant (any)  → amber
function styleForChunk(chunk, baseGameId) {
  if (chunk.scope === "variant") {
    return {
      pill:
        "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/25 border border-amber-300/40 dark:border-amber-500/30",
      label: chunk.variantName ? `Variant: ${chunk.variantName}` : "Variant",
    };
  }
  if (chunk.bg_id && baseGameId && chunk.bg_id !== baseGameId) {
    return {
      pill:
        "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30",
      label: "Expansion",
    };
  }
  return {
    pill:
      "bg-surface text-subtle hover:text-foreground hover:border-primary/40 border border-border",
    label: null,
  };
}

export default function CitationPill({ chunk, baseGameId, onJump }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState("bottom"); // "top" | "bottom"
  const ref = useRef(null);
  const closeTimerRef = useRef(null);

  // Smart vertical positioning: flip up if too close to bottom of viewport
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setPosition(spaceBelow < 280 ? "top" : "bottom");
  }, [open]);

  // Click-outside to close on mobile
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handlePillClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // On touch devices the popover is the click target; double-tap jumps.
    if (open && onJump) onJump(chunk);
    else setOpen((v) => !v);
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 150);
  };

  const { pill, label } = styleForChunk(chunk, baseGameId);

  const sourceTitle = chunk.bg_title || "Source";
  const pageText = chunk.page != null ? `p.${chunk.page}` : null;

  return (
    <span
      ref={ref}
      className="relative inline-block align-baseline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      <button
        type="button"
        onClick={handlePillClick}
        className={`inline-flex items-center justify-center mx-0.5 px-1.5 py-0 rounded-md text-[10px] font-bold leading-tight align-baseline transition-colors cursor-pointer ${pill}`}
        aria-label={`Citation ${chunk.id}: ${sourceTitle}${pageText ? ` ${pageText}` : ""}`}>
        {chunk.id}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: position === "bottom" ? -4 : 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === "bottom" ? -4 : 4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className={`absolute z-40 left-1/2 -translate-x-1/2 ${
              position === "bottom" ? "top-full mt-1" : "bottom-full mb-1"
            } w-72 max-w-[90vw]`}>
            <div className="bg-surface border border-border rounded-xl shadow-lg p-3 text-left">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-foreground truncate">
                    {sourceTitle}
                  </p>
                  {chunk.breadcrumb && (
                    <p className="text-[10px] text-muted truncate">
                      {chunk.breadcrumb}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {label && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      {label}
                    </span>
                  )}
                  {pageText && (
                    <span className="text-[10px] text-subtle">{pageText}</span>
                  )}
                </div>
              </div>
              <p className="text-[12px] text-foreground leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                {chunk.text}
              </p>
              {onJump && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onJump(chunk);
                  }}
                  className="mt-2 text-[11px] text-primary hover:underline">
                  Open in rulebook →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
