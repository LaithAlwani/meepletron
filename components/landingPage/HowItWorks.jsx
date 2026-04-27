"use client";
import { motion } from "motion/react";

const steps = [
  {
    num: "01",
    icon: "🎲",
    title: "Pick a game",
    desc: "Browse our library of board games — each one backed by its official indexed rulebook.",
  },
  {
    num: "02",
    icon: "💬",
    title: "Ask a question",
    desc: "Type any rule question in plain English. No board game jargon required.",
  },
  {
    num: "03",
    icon: "✅",
    title: "Get the answer",
    desc: "Meepletron finds the exact ruling from the official rulebook and explains it clearly.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-4 bg-surface-muted">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs uppercase tracking-widest font-semibold text-primary mb-3">
            Simple by design
          </p>
          <h2 className="text-3xl font-bold text-foreground mb-3">How It Works</h2>
          <p className="text-muted text-base">Three simple steps to rule clarity</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="bg-surface rounded-2xl p-8 shadow-sm border border-border-muted"
            >
              <span className="block text-6xl font-black text-border leading-none mb-4 select-none">
                {step.num}
              </span>
              <span className="text-4xl block mb-4">{step.icon}</span>
              <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
