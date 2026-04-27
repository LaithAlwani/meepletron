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
         All brand colours are driven by CSS variables in globals.css.
         The primary colour uses the `/ <alpha-value>` syntax so Tailwind's
         opacity modifiers work (bg-primary/10, text-primary/50, …).
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

      /* ── Font sizes (CSS-variable-driven for global resizing) ──────────── */
      fontSize: {
        xs:   ["var(--text-xs)",   { lineHeight: "1rem" }],
        sm:   ["var(--text-sm)",   { lineHeight: "1.25rem" }],
        base: ["var(--text-base)", { lineHeight: "1.5rem" }],
        lg:   ["var(--text-lg)",   { lineHeight: "1.75rem" }],
        xl:   ["var(--text-xl)",   { lineHeight: "1.75rem" }],
        "2xl":["var(--text-2xl)",  { lineHeight: "2rem" }],
        "3xl":["var(--text-3xl)",  { lineHeight: "2.25rem" }],
        "4xl":["var(--text-4xl)",  { lineHeight: "2.5rem" }],
        "5xl":["var(--text-5xl)",  { lineHeight: "1.1" }],
        "6xl":["var(--text-6xl)",  { lineHeight: "1.1" }],
      },

      /* ── Border radius ─────────────────────────────────────────────────── */
      borderRadius: {
        sm:    "var(--radius-sm)",
        DEFAULT:"var(--radius)",
        md:    "var(--radius)",
        lg:    "var(--radius-lg)",
        xl:    "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full:  "var(--radius-full)",
      },
    },
  },
  plugins: [],
};
