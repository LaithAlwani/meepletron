"use client";
import { motion } from "motion/react";

const SAMPLE_QUESTIONS = [
  "How do I set up the game?",
  "What are the win conditions?",
  "How does turn order work?",
];

// Welcome card shown when a chat has no messages yet. Big thumbnail, intro,
// and a couple of one-click suggested questions.
export default function EmptyChatState({ currentGame, onSampleClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-4 pt-10 pb-6 text-center px-6">
      <div className="relative">
        <img
          src={currentGame?.thumbnail}
          alt={currentGame?.title}
          className="w-24 h-24 rounded-2xl object-cover shadow-lg"
        />
        <img
          src="/logo.webp"
          alt="Meepletron"
          className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full border-2 border-bg shadow object-contain bg-surface"
        />
      </div>
      <div>
        <h3 className="font-bold text-lg text-foreground capitalize">{currentGame?.title}</h3>
        <p className="text-sm text-muted mt-1 leading-relaxed">
          Ask me anything about the rules,
          <br className="hidden sm:block" /> setup, or strategy.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-1">
        {SAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSampleClick(q)}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-muted hover:bg-surface-muted hover:border-primary/50 transition-all">
            {q}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
