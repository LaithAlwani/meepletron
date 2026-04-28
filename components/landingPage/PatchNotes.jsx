"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";

const CHANGELOG = [
  {
    date: "2026-04-28",
    items: [
      {
        type: "improvement",
        text: "More accurate answers — the AI now picks only the most relevant rulebook passages for your question before responding, reducing off-topic or incomplete replies",
      },
      {
        type: "fix",
        text: "When the AI is temporarily unavailable, you now see a clear message instead of the chat going silent",
      },
    ],
  },
  {
    date: "2026-04-27",
    items: [
      {
        type: "improvement",
        text: "Game search handles typos and partial names — searching 'cataan' or 'blood rage gods' now finds the right game",
      },
      {
        type: "improvement",
        text: "Expansions no longer clutter the game browser — the library now shows base games only, keeping things easier to browse",
      },
      {
        type: "fix",
        text: "AI answers no longer say \"check the rulebook\" — all the relevant information is shown directly in the response",
      },
    ],
  },
  {
    date: "2026-04-26",
    items: [
      {
        type: "new",
        text: "Brand new sign-in and sign-up pages with a cleaner, on-brand design",
      },
      {
        type: "fix",
        text: "Fixed sign-out button display issue in the navigation bar",
      },
      {
        type: "improvement",
        text: "UI overhaul for the game browser and chat interface, including better spacing, clearer typography, and a more cohesive color scheme",
      },
    ],
  },
];

const TYPE_STYLES = {
  new: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  improvement: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  fix: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
};

export default function PatchNotes() {
  const [newCutoff, setNewCutoff] = useState(null);

  useEffect(() => {
    setNewCutoff(new Date(Date.now() - 48 * 60 * 60 * 1000));
  }, []);

  return (
    <section id="updates" className="py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          
          <h2 className="text-3xl font-bold text-primary mb-3">Recent Updates</h2>
          <p className="text-muted text-base">What we&apos;ve been shipping</p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border-muted" />

          <div className="space-y-10">
            {CHANGELOG.map((entry, entryIndex) => {
              const entryDate = new Date(entry.date);
              const isNew = newCutoff ? entryDate >= newCutoff : false;
              const formattedDate = entryDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <motion.div
                  key={entry.date}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: entryIndex * 0.1 }}
                  className="relative pl-10"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface border-2 border-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>

                  {/* Date + NEW badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-foreground">{formattedDate}</span>
                    {isNew && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-fg tracking-wide">
                        NEW
                      </span>
                    )}
                  </div>

                  {/* Change items */}
                  <ul className="space-y-2.5">
                    {entry.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
                        <span
                          className={`shrink-0 mt-0.5 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            TYPE_STYLES[item.type] ?? TYPE_STYLES.improvement
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="leading-relaxed">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
