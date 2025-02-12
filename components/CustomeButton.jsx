"use client";

import { motion } from "motion/react";

export default function CustomButton({ onClick, children, className = "", disabled }) {
  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={` inline-block bg-blue-600 text-white py-3 px-6 shadow hover:bg-blue-700 disabled:bg-gray-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-slate-900 font-bold transition disabled:cursor-not-allowed ${className}`}>
        {children}
      </button>
    </motion.div>
  );
}
