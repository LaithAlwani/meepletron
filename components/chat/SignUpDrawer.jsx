"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { IoClose } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";

const BENEFITS = [
  { label: "50,000 tokens per day", sub: "5× more than guest" },
  { label: "Permanent chat history", sub: "Never lose a conversation" },
  { label: "Sync across devices", sub: "Pick up where you left off" },
  { label: "Free forever", sub: "No payment required" },
];

// Slides in from the left when a guest hits their daily token cap, pitches
// the free-account upgrade. Closes on backdrop click or the X button.
export default function SignUpDrawer({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="signup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-30 backdrop-blur-[1px]"
          />
          <motion.aside
            key="signup-drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 w-72 h-full bg-bg z-40 shadow-2xl flex flex-col">

            <div className="flex items-start justify-between px-5 py-4 border-b border-border-muted">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Daily limit reached</h3>
                <p className="text-xs text-muted mt-0.5">Sign up free to keep chatting</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-surface-muted transition-colors text-muted shrink-0 ml-2">
                <IoClose size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
              <p className="text-sm text-muted leading-relaxed">
                Guest accounts include{" "}
                <span className="font-semibold text-foreground">10,000 tokens per day</span>.
                Create a free account and get more — no credit card needed.
              </p>

              <div className="flex flex-col gap-3">
                {BENEFITS.map(({ label, sub }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                      <FaCheck size={9} className="text-primary" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
                      <p className="text-xs text-muted">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 pb-8 pt-4 flex flex-col gap-2 border-t border-border-muted">
              <Link
                href="/sign-up"
                className="w-full py-2.5 bg-primary text-primary-fg rounded-xl font-semibold text-sm text-center hover:bg-primary-hover transition-colors">
                Create free account
              </Link>
              <Link
                href="/sign-in"
                className="w-full py-2.5 bg-surface-muted text-foreground rounded-xl font-medium text-sm text-center hover:bg-border-muted transition-colors border border-border-muted">
                Sign in
              </Link>
              <p className="text-[10px] text-center text-subtle mt-1">
                Guest tokens also reset daily at midnight UTC
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
