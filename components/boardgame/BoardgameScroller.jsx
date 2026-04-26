"use client";
import { useRef } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useGetBoardgames } from "@/utils/hooks";
import BoardgameContainer from "./BoardgameContainer";

export default function BoardgameScroller() {
  const { boardgames, isLoading } = useGetBoardgames({ limit: 10 });
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-yellow-500 mb-1">
              New Arrivals
            </p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Recently Added
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll(-1)}
              aria-label="Scroll left"
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-yellow-400 hover:border-blue-300 dark:hover:border-yellow-600 transition-colors shadow-sm"
            >
              <MdChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Scroll right"
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-yellow-400 hover:border-blue-300 dark:hover:border-yellow-600 transition-colors shadow-sm"
            >
              <MdChevronRight size={20} />
            </button>
            <Link
              href="/boardgames"
              className="text-sm font-medium text-blue-600 dark:text-yellow-400 hover:underline whitespace-nowrap"
            >
              View all games →
            </Link>
          </div>
        </div>

        {/* Scroll track */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading
            ? [...Array(10)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2 shrink-0 w-40">
                  <div className="aspect-square w-full rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" />
                </div>
              ))
            : boardgames.map((boardgame, index) => (
                <motion.div
                  key={boardgame._id}
                  className="shrink-0 w-40"
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "0px -80px 0px 0px" }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                >
                  <BoardgameContainer boardgame={boardgame} />
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
}
