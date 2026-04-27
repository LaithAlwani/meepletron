/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      /* ── Colour tokens ─────────────────────────────────────────────────────
         All brand colours are driven by CSS variables in globals.css so that
         a single token class (bg-surface, text-muted, …) resolves to the
         correct value in both light and dark mode at runtime.
         Primary uses the `/ <alpha-value>` syntax so opacity modifiers work:
         bg-primary/10, text-primary/50, etc.
      ─────────────────────────────────────────────────────────────────────── */
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover:   "var(--color-primary-hover)",
          fg:      "var(--color-primary-fg)",
        },
        bg:      "var(--color-bg)",
        surface: {
          DEFAULT: "var(--color-surface)",
          muted:   "var(--color-surface-muted)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          muted:   "var(--color-border-muted)",
        },
        foreground: "var(--color-text)",
        muted:      "var(--color-text-muted)",
        subtle:     "var(--color-text-subtle)",
        background: "var(--color-bg)",
      },

      /* ── Font families ─────────────────────────────────────────────────── */
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },

      /* ── Font sizes ────────────────────────────────────────────────────── */
      fontSize: {
        xs:    ["0.75rem",  { lineHeight: "1rem" }],
        sm:    ["0.875rem", { lineHeight: "1.25rem" }],
        base:  ["1rem",     { lineHeight: "1.5rem" }],
        lg:    ["1.125rem", { lineHeight: "1.75rem" }],
        xl:    ["1.25rem",  { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem",   { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem",  { lineHeight: "2.5rem" }],
        "5xl": ["3rem",     { lineHeight: "1.1" }],
        "6xl": ["3.75rem",  { lineHeight: "1.1" }],
      },

      /* ── Border radius ─────────────────────────────────────────────────── */
      borderRadius: {
        sm:      "0.5rem",
        DEFAULT: "0.75rem",
        md:      "0.75rem",
        lg:      "1rem",
        xl:      "1.25rem",
        "2xl":   "1.5rem",
        full:    "9999px",
      },
    },
  },
  plugins: [],
};
