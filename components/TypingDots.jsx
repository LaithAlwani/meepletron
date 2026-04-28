import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const PHASE_PHRASES = {
  searching: [
    "Searching the rulebook…",
    "Looking it up…",
    "Digging through the rules…",
    "Scanning the pages…",
    "Checking the index…",
    "Flipping through the manual…",
  ],
  reading: [
    "Found something…",
    "Reading the relevant section…",
    "Cross-referencing…",
    "Reviewing the context…",
    "Almost ready…",
  ],
  writing: [
    "Writing the answer…",
    "Putting it together…",
    "Here it comes…",
  ],
};

function pickPhrase(phase, exclude = null) {
  const options = PHASE_PHRASES[phase] ?? PHASE_PHRASES.searching;
  const filtered = exclude ? options.filter((p) => p !== exclude) : options;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export default function TypingIndicator({ phase = "searching" }) {
  const [phrase, setPhrase] = useState(() => pickPhrase(phase));

  useEffect(() => {
    setPhrase(pickPhrase(phase));
  }, [phase]);

  useEffect(() => {
    const id = setInterval(() => {
      setPhrase((prev) => pickPhrase(phase, prev));
    }, 3000);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <div className="flex flex-col items-start gap-1 pb-1">
      <div className="flex items-center space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 bg-muted rounded-full"
            animate={{ opacity: [1, 0, 1] }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={phrase}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="text-[11px] text-muted leading-none"
        >
          {phrase}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
