"use client";
import Loader from "../Loader";

export default function Button({
  children,
  onClick,
  variant = "primary",
  isLoading = false,
  disabled = false,
  type = "submit",
  styles = "",
}) {
  const baseStyles = "px-4 py-2 shadow cursor-pointer font-bold transition-all rounded-lg";
  const variantStyles = {
    primary:
      "dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-slate-900 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-600",
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
    outline: "border border-blue-500 text-blue-700 hover:bg-blue-50",
    accept: "bg-green-500 disabled:bg-green-300 text-white hover:bg-green-600",
    reject: "bg-red-500 disabled:bg-red-300 text-white hover:bg-red-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${styles} ${
        isLoading || disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}>
      {isLoading ? <Loader width="1rem" /> : children}
    </button>
  );
}
