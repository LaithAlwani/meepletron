"use client";

import { motion } from "motion/react";
import { useTheme } from "next-themes";
import Loader from "../Loader";

export default function Button({
  children,
  onClick,
  variant = "primary",
  isLoading = false,
  styles = "",
}) {
  const { theme } = useTheme();

  const baseStyles =
    " px-4 py-2 shadow cursor-pointer font-bold transition transition-all";
  const variantStyles = {
    primary: `${
      theme === "dark"
        ? "bg-yellow-500 hover:bg-yellow-400 text-slate-900"
        : "bg-blue-600 text-white hover:bg-blue-700"
    }  disabled:bg-gray-500`,
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
    outline: "border border-blue-500 text-blue-500 hover:bg-blue-50",
    accept: "bg-green-500 disabled:bg-green-300 text-white ",
    reject: "bg-red-500 disabled:bg-red-300 text-white   ",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={isLoading}
      type="submit"
      className={`${baseStyles} ${variantStyles[variant]} ${styles} ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`}>
      {isLoading ? <Loader width="1rem" /> : children}
    </motion.button>
  );
}
