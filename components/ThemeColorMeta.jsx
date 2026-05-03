"use client";
import { useEffect } from "react";
import { useTheme } from "next-themes";

const COLORS = {
  light: "#f7f7f7",
  dark: "#0f172a",
};

// Updates the dynamic <meta name="theme-color"> whenever the user toggles the theme.
// The static media-query versions in layout.js cover the pre-hydration / no-JS case;
// this overrides them once next-themes has resolved the active theme.
export default function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = COLORS[resolvedTheme] ?? COLORS.light;

    let meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", color);
  }, [resolvedTheme]);

  return null;
}
