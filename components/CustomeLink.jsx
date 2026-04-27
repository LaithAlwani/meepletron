'use client'
import Link from "next/link";
import { motion } from "motion/react";

export default function CustomLink({ href, children, className = "" }) {
  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{scale:0.9}}>
      <Link
        href={href}
        className={`min-w-32 text-center inline-block bg-primary text-primary-fg py-3 px-6 shadow-sm hover:bg-primary-hover font-bold transition duration-300 ${className}`}>
        {children}
      </Link>
    </motion.div>
  );
}
