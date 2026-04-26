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
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs uppercase tracking-widest font-semibold text-blue-600 dark:text-yellow-500 mb-3">
            Why Meepletron
          </p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Features
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-base">
            Everything you need to settle rules debates fast
          </p>
        </motion.div>

        {/* Cards */}
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
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700 shadow-sm"
              >
                <div className="bg-blue-100 dark:bg-yellow-500/10 rounded-xl p-3 w-fit mb-5">
                  <Icon size={22} className="text-blue-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
