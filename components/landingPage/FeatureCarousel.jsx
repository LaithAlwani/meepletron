"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { ImBubbles } from "react-icons/im";
import { GiCardboardBox, GiOpenBook } from "react-icons/gi";
import { IoChevronDownOutline } from "react-icons/io5";

const SLIDES = [
  {
    id: "chat",
    badge: "AI assistant",
    title: "Your AI board game expert",
    description:
      "Ask any rule question in plain English. Meepletron pulls the answer straight from the official rulebook — no more pausing game night to flip through pages.",
    cta: { label: "Browse board games", href: "/boardgames", Icon: GiOpenBook },
    visual: "brand",
  },
  {
    id: "tuckbox",
    badge: "New",
    title: "Print your own tuckbox",
    description:
      "Generate a custom card box for any game in the library. We'll prefill the artwork from the game's cover — tweak the dimensions, download a print-ready PDF, fold, glue, done.",
    cta: { label: "Try the tuckbox generator", href: "/tuckbox", Icon: GiCardboardBox },
    visual: "tuckbox",
  },
  {
    id: "library",
    badge: "Growing library",
    title: "Hundreds of games",
    description:
      "Catan, Wingspan, Twilight Imperium, and more — new titles added every week. Don't see yours? Drop a request and we'll add it.",
    cta: { label: "Open the library", href: "/boardgames", Icon: ImBubbles },
    visual: "library",
  },
];

const AUTOPLAY_MS = 6000;

export default function FeatureCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(
      () => setActive((i) => (i + 1) % SLIDES.length),
      AUTOPLAY_MS
    );
    return () => clearInterval(t);
  }, [paused]);

  const slide = SLIDES[active];
  const CtaIcon = slide.cta.Icon;

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-4 bg-bg overflow-hidden">
      {/* Soft ambient blob behind the content — adds depth without a card */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto h-[60vh] max-w-3xl rounded-full bg-primary/10 blur-3xl pointer-events-none"
      />

      <div
        className="relative w-full max-w-5xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-16 min-h-[460px] md:min-h-[340px]">
          {/* Visual side */}
          <div className="flex items-center justify-center min-h-[200px] md:min-h-[280px] order-1 md:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id + "-visual"}
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.04, y: -12 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {slide.visual === "brand" && <BrandVisual />}
                {slide.visual === "tuckbox" && <TuckboxVisual />}
                {slide.visual === "library" && <LibraryVisual />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text side */}
          <div className="flex flex-col justify-center text-center md:text-left order-2 md:order-2 min-h-[240px] md:min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id + "-text"}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <span className="inline-block text-primary text-[11px] font-bold uppercase tracking-[0.18em] mb-4">
                  {slide.badge}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                  {slide.title}
                </h2>
                <p className="text-muted text-base md:text-lg leading-relaxed mb-7 max-w-md mx-auto md:mx-0">
                  {slide.description}
                </p>
                <Link
                  href={slide.cta.href}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-fg font-semibold hover:bg-primary-hover transition-colors text-sm w-fit mx-auto md:mx-0 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <CtaIcon size={16} />
                  {slide.cta.label}
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slide indicators — fixed-width dots so the row never reflows */}
        <div className="flex items-center justify-center gap-2 mt-12">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Go to slide: ${s.title}`}
              className={`h-2 w-8 rounded-full transition-colors ${
                i === active
                  ? "bg-primary"
                  : "bg-subtle hover:bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scroll-down hint — wrapper handles X centering so Motion's transform
          doesn't clobber Tailwind's -translate-x-1/2 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <motion.button
          type="button"
          onClick={() =>
            window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" })
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 0.6 },
            y: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
          }}
          aria-label="Scroll down"
          className="text-subtle hover:text-foreground transition-colors p-2"
        >
          <IoChevronDownOutline size={26} />
        </motion.button>
      </div>
    </section>
  );
}

function BrandVisual() {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <img
        src="/logo.webp"
        alt="Meepletron"
        className="w-32 h-32 sm:w-36 sm:h-36 object-contain drop-shadow-lg"
      />
      <p className="text-sm sm:text-base font-semibold text-primary tracking-wide">
        Your AI board game expert
      </p>
    </div>
  );
}

function TuckboxVisual() {
  return (
    <img
      src="/tuckbox.png"
      alt="Tuckbox preview"
      className="max-h-64 w-auto object-contain drop-shadow-xl"
    />
  );
}

function LibraryVisual() {
  return (
    <img
      src="/games-removebg-preview.png"
      alt="Board games library"
      className="max-h-64 w-auto object-contain drop-shadow-xl"
    />
  );
}
