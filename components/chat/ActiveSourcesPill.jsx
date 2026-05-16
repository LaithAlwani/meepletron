"use client";
import { IoClose } from "react-icons/io5";

// Pill row above the message list that surfaces which expansion sources are
// active for the current chat. Hidden entirely when no expansions are toggled
// on — the base game is always implicit and doesn't need its own pill.
export default function ActiveSourcesPill({ boardgame, extraSourceIds, onRemove }) {
  if (!boardgame || extraSourceIds.length === 0) return null;

  return (
    <div className="shrink-0 px-3 py-2 border-b border-border-muted bg-surface-muted/40 flex items-center gap-2 overflow-x-auto hide-scrollbar">
      <span className="text-[11px] uppercase tracking-wide text-subtle font-semibold shrink-0">
        Sources:
      </span>
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-border text-xs font-medium text-foreground shrink-0">
        {boardgame.title}
      </span>
      {boardgame.expansions
        ?.filter((e) => extraSourceIds.includes(e._id))
        .map((exp) => (
          <span
            key={exp._id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium shrink-0">
            {exp.title}
            <button
              type="button"
              onClick={() => onRemove(exp._id)}
              className="hover:opacity-70 transition-opacity"
              aria-label={`Remove ${exp.title} from sources`}>
              <IoClose size={12} />
            </button>
          </span>
        ))}
    </div>
  );
}
