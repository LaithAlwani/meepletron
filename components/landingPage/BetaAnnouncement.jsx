"use client";
import { motion } from "motion/react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { GiOpenBook } from "react-icons/gi";
import { ImBubbles } from "react-icons/im";
import { IoChevronDownOutline } from "react-icons/io5";

export default function BetaAnnouncement() {
  const { user, isLoaded } = useUser();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="mb-6"
      >
        <img src="/logo.webp" alt="Meepletron logo" className="w-28 h-28 object-contain mx-auto" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-5xl md:text-6xl font-bold text-foreground mb-3"
      >
        Meepletron
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="text-xl md:text-2xl font-semibold text-primary mb-6"
      >
        Your AI Board Game Rules Expert
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="max-w-lg text-muted text-base md:text-lg leading-relaxed mb-10"
      >
        Ask any rule question and get instant answers straight from the official rulebook.
        No more pausing game night to flip through pages.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="flex flex-col sm:flex-row items-center gap-3"
      >
        <Link
          href="/boardgames"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-fg font-semibold shadow-md hover:bg-primary-hover transition-colors text-sm"
        >
          <GiOpenBook size={18} />
          Browse Games
        </Link>

        {!user && isLoaded && (
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-surface transition-colors text-sm"
          >
            <ImBubbles size={16} />
            Create Free Account
          </Link>
        )}
      </motion.div>

      <div className="absolute bottom-6 -translate-x-1/2 animate-bounce text-subtle">
        <IoChevronDownOutline size={24} />
      </div>
    </section>
  );
}
