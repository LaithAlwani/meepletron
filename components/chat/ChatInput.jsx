"use client";
import { FaPaperPlane } from "react-icons/fa";
import { Textarea } from "@/components/ui";

// Sticky bottom textarea + send button. Auto-grows up to 120px tall; submits
// on Enter (without Shift). Token counter shows in the top-right when the
// parent passes a `tokensRemaining` number.
export default function ChatInput({
  input,
  inputRef,
  onInputChange,
  onSubmit,
  isLoading,
  tokensRemaining,
}) {
  return (
    <div className="shrink-0 px-3 pb-4 pt-2 border-t border-border-muted bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm relative">
      {tokensRemaining !== null && tokensRemaining !== undefined && (
        <span
          className={`absolute bottom-full right-3 mb-1 text-[10px] font-medium pointer-events-none ${
            tokensRemaining <= 5_000 ? "text-red-400" : "text-subtle/70"
          }`}>
          {tokensRemaining.toLocaleString()} tokens left today
        </span>
      )}
      <form
        onSubmit={onSubmit}
        className="max-w-xl mx-auto flex items-end gap-2 bg-surface-muted rounded-2xl px-3 py-2 ring-1 ring-border focus-within:ring-primary transition-all">
        <Textarea
          placeholder="Ask Meepletron…"
          rows="1"
          ref={inputRef}
          value={input}
          disabled={isLoading}
          onChange={onInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          className="flex-1 bg-transparent border-none text-foreground placeholder:text-subtle focus:ring-0 focus-visible:ring-0"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="shrink-0 p-2.5 rounded-xl bg-primary text-primary-fg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
          <FaPaperPlane size={13} />
        </button>
      </form>
    </div>
  );
}
