"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

// Slim banner above the messages reminding guests to sign in for permanent
// history. Only renders when Clerk has resolved AND there's no user.
export default function GuestBanner({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="shrink-0 overflow-hidden">
          <div className="text-center text-xs py-2 px-4 bg-amber-50 dark:bg-yellow-500/10 border-b border-amber-200 dark:border-yellow-500/20 text-amber-700 dark:text-yellow-400">
            <Link href="/sign-in" className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity">
              Sign in
            </Link>{" "}
            to save your chat history permanently · Guest history kept for 30 days
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
