'use client'
import { motion } from "motion/react";

export default function BackgroundImage({ image, title }) {
  return (
    image && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 w-full h-screen -z-10">
        <img
          src={image}
          alt={`${title} board game`}
          title={`${title} board game`}
          className="w-full h-full object-cover object-top opacity-[0.12]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f7f7f7]/70 to-[#f7f7f7] dark:via-[#0f172a]/70 dark:to-[#0f172a]" />
      </motion.div>
    )
  );
}
