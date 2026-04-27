"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const LIMIT = 300;

export default function ExpandableText({ text, className = "" }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const isLong = text.length > LIMIT;
  const cut = isLong ? (text.lastIndexOf(" ", LIMIT) || LIMIT) : LIMIT;
  const preview = text.slice(0, cut);
  const rest = text.slice(cut).trim();

  return (
    <div>
      <p className={`text-sm leading-relaxed whitespace-pre-line ${className}`}>
        {isLong ? preview : text}{isLong && !expanded && "…"}
      </p>
      <AnimatePresence initial={false}>
        {isLong && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <p className={`text-sm leading-relaxed whitespace-pre-line ${className}`}>
              {rest}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-medium text-primary hover:underline underline-offset-2 transition-colors">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
