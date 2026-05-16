"use client";
import Link from "next/link";
import { IoArrowBack, IoBookOutline } from "react-icons/io5";
import { BsLayers } from "react-icons/bs";
import ThemeSwitch from "@/components/ThemeSwitch";

export default function ChatHeader({
  currentGame,
  boardgame,
  expansionCount = 0,
  onBack,
  onRulebookClick,
  onExpansionsClick,
}) {
  return (
    <nav className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-border-muted bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
      <button
        onClick={onBack}
        className="p-2 rounded-xl hover:bg-surface-muted transition-colors text-muted shrink-0">
        <IoArrowBack size={18} />
      </button>

      <Link
        href={
          currentGame?.parent_id
            ? `/boardgames/${boardgame?.slug || boardgame?._id || currentGame?.parent_id}/expansions/${currentGame.slug || currentGame._id}`
            : `/boardgames/${currentGame?.slug || currentGame?._id}`
        }
        className="flex items-center gap-2.5 flex-1 min-w-0 group">
        <img
          src={currentGame?.thumbnail}
          alt={currentGame?.title}
          className="h-9 w-9 rounded-xl object-cover shrink-0 shadow-sm"
        />
        <div className="min-w-0">
          <h2 className="capitalize font-semibold truncate text-foreground group-hover:text-primary transition-colors">
            {currentGame?.title}
          </h2>
          {currentGame?.parent_id && (
            <p className="text-sm text-subtle truncate">Expansion</p>
          )}
        </div>
      </Link>

      <div className="p-2 rounded-xl hover:bg-surface-muted transition-colors text-muted shrink-0 flex items-center cursor-pointer [&>span]:hidden">
        <ThemeSwitch />
      </div>

      <button
        type="button"
        onClick={onRulebookClick}
        className="p-2 rounded-xl hover:bg-surface-muted transition-colors text-muted shrink-0 flex flex-col items-center gap-0.5"
        aria-label="Open rulebook">
        <IoBookOutline size={18} />
        <span className="text-[10px] font-medium leading-none">rulebook</span>
      </button>

      <button
        onClick={onExpansionsClick}
        className="p-2 rounded-xl hover:bg-surface-muted transition-colors text-muted shrink-0 flex flex-col items-center gap-0.5">
        <div className="relative">
          {expansionCount > 0 && (
            <span className="absolute -top-1.5 -right-2 text-[10px] font-bold leading-none text-primary">
              {expansionCount}
            </span>
          )}
          <BsLayers size={18} />
        </div>
        <span className="text-[10px] font-medium leading-none">expansions</span>
      </button>
    </nav>
  );
}
