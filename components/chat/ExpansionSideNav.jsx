"use client";
import { AnimatePresence, motion } from "motion/react";
import { IoClose } from "react-icons/io5";
import { BsLayers } from "react-icons/bs";

function SourceRow({ game, checked, locked = false, onToggle }) {
  return (
    <label
      className={`flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-xl transition-all capitalize text-sm font-medium ${
        locked ? "cursor-default" : "cursor-pointer hover:bg-surface-muted"
      } ${checked && !locked ? "bg-primary/10" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={onToggle}
        className="w-4 h-4 accent-primary disabled:opacity-60 shrink-0"
      />
      <img
        src={game?.thumbnail}
        alt={game?.title}
        className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm"
      />
      <span className="truncate flex-1 text-foreground">{game?.title}</span>
      {locked && (
        <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide shrink-0">
          Base
        </span>
      )}
    </label>
  );
}

// Right-side drawer listing the base game plus toggleable expansions. The
// base game is permanently checked + disabled so it's always in scope.
export default function ExpansionSideNav({
  open,
  onClose,
  boardgame,
  extraSourceIds,
  onToggleSource,
}) {
  if (!boardgame) return null;
  const expansionCount = boardgame.expansions?.length ?? 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-10 backdrop-blur-[1px]"
          />
          <motion.aside
            key="sidenav"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 w-72 h-full bg-bg z-20 shadow-2xl flex flex-col">

            <div className="flex items-center justify-between px-4 py-4 border-b border-border-muted">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Active sources</h3>
                <p className="text-xs text-subtle mt-0.5">
                  The AI uses every checked source when answering. Base game is always on.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-surface-muted transition-colors text-muted">
                <IoClose size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-subtle">
                Base Game
              </p>
              <SourceRow game={boardgame} checked locked />

              <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-subtle border-t border-border-muted mt-2">
                Expansions
                {expansionCount > 0 && (
                  <span className="ml-1.5 bg-primary/15 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {expansionCount}
                  </span>
                )}
              </p>

              {expansionCount > 0 ? (
                boardgame.expansions.map((exp) => (
                  <SourceRow
                    key={exp._id}
                    game={exp}
                    checked={extraSourceIds.includes(exp._id)}
                    onToggle={() => onToggleSource(exp._id)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                  <BsLayers size={28} className="text-border" />
                  <p className="text-sm font-medium text-subtle">No expansions yet</p>
                  <p className="text-xs text-subtle">
                    Expansions will appear here once they&apos;re added.
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
