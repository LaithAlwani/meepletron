"use client";
import { motion } from "motion/react";
import { FaBoltLightning, FaBullseye } from "react-icons/fa6";
import { BsCollection } from "react-icons/bs";

const features = [
  {
    icon: FaBoltLightning,
    title: "Instant Answers",
    desc: "Get the ruling in seconds — no more mid-game manual searches.",
  },
  {
    icon: FaBullseye,
    title: "Rulebook Accurate",
    desc: "Every answer is grounded in the official rulebook, not guesswork.",
  },
  {
    icon: BsCollection,
    title: "Growing Library",
    desc: "New games added regularly. Request any title we're missing.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs uppercase tracking-widest font-semibold text-primary mb-3">
            Why Meepletron
          </p>
          <h2 className="text-3xl font-bold text-foreground mb-3">Features</h2>
          <p className="text-muted text-base">Everything you need to settle rules debates fast</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                className="bg-surface rounded-2xl p-8 border border-border-muted shadow-sm"
              >
                <div className="bg-primary/15 rounded-xl p-3 w-fit mb-5">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
