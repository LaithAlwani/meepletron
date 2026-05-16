"use client";
import { Fragment } from "react";
import { AnimatePresence, motion } from "motion/react";
import TypingIndicator from "@/components/TypingDots";
import MessageBubble from "./MessageBubble";

// Human-friendly relative date for grouping headers ("Today", "Yesterday",
// then weekday names, falling back to a full date).
function getDateLabel(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - msgDay) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DateSeparator({ label }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="text-[11px] font-medium text-muted bg-surface-muted px-3 py-1 rounded-full border border-border-muted">
        {label}
      </span>
    </div>
  );
}

export default function MessageList({
  messages,
  isLoading,
  isStreaming,
  loadingPhase,
  user,
  baseGameId,
  onJumpToChunk,
}) {
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => {
          const msgDate = message.createdAt ?? null;
          const prevDate = index > 0 ? messages[index - 1].createdAt ?? null : null;
          const msgLabel = getDateLabel(msgDate);
          const prevLabel = getDateLabel(prevDate);
          const showSeparator = msgLabel && msgLabel !== prevLabel;
          const isLastAssistant =
            index === messages.length - 1 && message.role === "assistant";
          return (
            <Fragment key={message._id || message.id}>
              {showSeparator && <DateSeparator label={msgLabel} />}
              <MessageBubble
                message={message}
                user={user}
                isStreaming={isLoading && isLastAssistant}
                baseGameId={baseGameId}
                onJumpToChunk={onJumpToChunk}
              />
            </Fragment>
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {isLoading && !isStreaming && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-end gap-2">
            <img
              src="/logo.webp"
              alt="logo"
              className="w-7 h-7 object-contain rounded-full shrink-0 border border-border-muted"
            />
            <TypingIndicator phase={loadingPhase} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
