import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const PHRASES = [
  "Thinking…",
  "Flipping through the manual…",
  "Reading the rulebook…",
  "Checking the rules…",
  "Consulting the guide…",
  "Looking it up…",
  "Scanning the pages…",
  "Finding the answer…",
  "Cross-referencing…",
  "Digging through the rules…",
  "Parsing the fine print…",
  "Almost there…",
  "Searching the index…",
  "Reviewing the sections…",
];

export default function TypingIndicator() {
  const [phrase, setPhrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)]);

  useEffect(() => {
    const pick = () => {
      setPhrase((prev) => {
        const options = PHRASES.filter((p) => p !== prev);
        return options[Math.floor(Math.random() * options.length)];
      });
    };
    const id = setInterval(pick, 5000);
    return () => clearInterval(id);
  }, []);

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
