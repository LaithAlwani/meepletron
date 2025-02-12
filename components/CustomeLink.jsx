'use client'
import Link from "next/link";
import { motion } from "motion/react";

export default function CustomLink({ href, children, className = "" }) {
  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{scale:0.9}}>
      <Link
        href={href}
        className={` min-w-32 text-center inline-block  bg-blue-600 text-white py-3 px-6 shadow-sm hover:bg-blue-700 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-slate-900 font-bold transition duration-300 ${className}`}>
        {children}
      </Link>
    </motion.div>
  );
}
