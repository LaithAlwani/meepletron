"use client";
import Loader from "../Loader";

const base = "inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold shadow-sm cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const variants = {
  primary:   "bg-primary text-primary-fg hover:bg-primary-hover disabled:opacity-50",
  secondary: "bg-gray-500 text-white hover:bg-gray-600 disabled:opacity-50",
  outline:   "border border-primary text-primary hover:bg-primary/10",
  accept:    "bg-green-500 text-white hover:bg-green-600 disabled:opacity-50",
  reject:    "bg-red-500 text-white hover:bg-red-600 disabled:opacity-50",
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  isLoading = false,
  disabled = false,
  type = "submit",
  styles = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      type={type}
      className={`${base} ${variants[variant]} ${styles} ${isLoading || disabled ? "cursor-not-allowed" : ""}`}
    >
      {isLoading ? <Loader width="1rem" /> : children}
    </button>
  );
}
