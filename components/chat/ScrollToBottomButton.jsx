"use client";
import { AnimatePresence, motion } from "motion/react";
import { FaArrowDown } from "react-icons/fa";

// Floating round button that appears when the user has scrolled away from
// the latest message. Click brings them back to the live tail.
export default function ScrollToBottomButton({ show, onClick }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          key="scroll-btn"
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.9 }}
          onClick={onClick}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-surface shadow-lg border border-border rounded-full p-2.5 text-muted hover:bg-surface-muted transition-colors z-10">
          <FaArrowDown size={13} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
