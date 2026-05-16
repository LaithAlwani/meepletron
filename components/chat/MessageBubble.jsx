"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomeToast";
import CitationPill from "@/components/chat/CitationPill";

// Recursively walks ReactMarkdown's `children` and replaces inline `[N]`
// markers with <CitationPill /> components. Only matches numbers that have
// a corresponding chunk in the annotation — other bracketed numbers
// (e.g. "[1] turn 1") are left as plain text.
function renderCitationsInChildren(children, chunkMap, baseGameId, onJump, keyPrefix = "c") {
  if (!chunkMap || chunkMap.size === 0) return children;

  const transform = (node, idx) => {
    if (typeof node !== "string") return node;
    const parts = [];
    const regex = /\[(\d+)\]/g;
    let lastIndex = 0;
    let match;
    let partIdx = 0;
    while ((match = regex.exec(node)) !== null) {
      const id = parseInt(match[1], 10);
      const chunk = chunkMap.get(id);
      if (!chunk) continue;
      if (match.index > lastIndex) parts.push(node.slice(lastIndex, match.index));
      parts.push(
        <CitationPill
          key={`${keyPrefix}-${idx}-${partIdx++}`}
          chunk={chunk}
          baseGameId={baseGameId}
          onJump={onJump}
        />,
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex === 0) return node;
    if (lastIndex < node.length) parts.push(node.slice(lastIndex));
    return parts;
  };

  if (Array.isArray(children)) {
    return children.flatMap((child, i) => {
      const transformed = transform(child, i);
      return Array.isArray(transformed) ? transformed : [transformed];
    });
  }
  return transform(children, 0);
}

function RateMessage({ id, existingRating, user }) {
  const [rating, setRating] = useState(existingRating || "");

  const rateMessage = async (newRating) => {
    if (!user) return toast.error("Sign in to rate messages");
    setRating(newRating);
    const res = await fetch("/api/chat/rate-message", {
      method: "POST",
      body: JSON.stringify({ id, rating: newRating }),
    });
    const { message } = await res.json();
    if (!res.ok) {
      setRating(existingRating || "");
      return toast.error("Failed to save rating");
    }
    toast.custom((t) => <CustomToast message={message} id={t.id} />, { duration: 1500 });
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => rateMessage("wrong")}
        className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
        <FaThumbsDown size={14} className={rating === "wrong" ? "text-red-500" : "text-muted"} />
      </button>
      <button
        onClick={() => rateMessage("correct")}
        className="p-1 rounded-md hover:bg-green-50 dark:hover:bg-green-500/10 transition-all">
        <FaThumbsUp size={14} className={rating === "correct" ? "text-green-500" : "text-muted"} />
      </button>
    </div>
  );
}

export default function MessageBubble({ message, user, isStreaming, baseGameId, onJumpToChunk }) {
  const { _id, id, role, content, rating, annotations } = message;
  const isUser = role === "user";

  if (!isUser && !content) return null;

  // Pull the chunks annotation written by app/api/chat/route.js. It arrives
  // in onFinish so it's only present after the response completes — fine.
  const chunksAnnotation = annotations?.find((a) => a?.type === "chunks");
  const chunkMap = chunksAnnotation
    ? new Map(chunksAnnotation.chunks.map((c) => [c.id, c]))
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <img
          src="/logo.webp"
          alt="Meepletron"
          className="w-7 h-7 object-contain rounded-full shrink-0 mb-1 border border-border-muted"
        />
      )}

      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isUser
              ? "bg-primary text-primary-fg rounded-br-md shadow-sm"
              : "bg-surface-muted text-foreground rounded-bl-md shadow-sm ring-1 ring-border-muted"
          }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <>
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="text-sm leading-relaxed mb-1 last:mb-0">
                      {renderCitationsInChildren(children, chunkMap, baseGameId, onJumpToChunk)}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-sm list-disc pl-4 space-y-0.5 my-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-sm list-decimal pl-4 space-y-0.5 my-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">
                      {renderCitationsInChildren(children, chunkMap, baseGameId, onJumpToChunk)}
                    </li>
                  ),
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                }}>
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-[2px] h-[14px] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
              )}
            </>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center gap-2.5 px-1 flex-wrap">
            {annotations?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {annotations.map((ann, i) =>
                  ann.url ? (
                    <a
                      key={i}
                      href={ann.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] font-medium px-2 py-0.5 rounded-full border border-border bg-surface text-subtle hover:border-primary hover:text-primary transition-colors">
                      p.{ann.pageNumber}
                    </a>
                  ) : null,
                )}
              </div>
            )}
            <RateMessage id={_id || id} existingRating={rating} user={user} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
