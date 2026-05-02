"use client";
import { motion, useReducedMotion } from "motion/react";

const ROOT_FONT_PX = 16;

function parseSizePx(value) {
  if (!value) return 24;
  if (typeof value === "number") return value;
  const trimmed = String(value).trim();
  if (trimmed.endsWith("rem")) return parseFloat(trimmed) * ROOT_FONT_PX;
  if (trimmed.endsWith("px")) return parseFloat(trimmed);
  const num = parseFloat(trimmed);
  return Number.isFinite(num) ? num : 24;
}

export default function Loader({ width, height = "auto", fullScreen = false }) {
  const reduced = useReducedMotion();

  const isFullScreen = fullScreen || height === "h-screen";
  const sizeValue = width || (isFullScreen ? "3rem" : "1.5rem");
  const sizePx = parseSizePx(sizeValue);

  const showHalo = sizePx >= 22; // ~1.4rem cutoff — skip on button-sized loaders
  const bounceDy = Math.min(4, Math.max(1, sizePx * 0.1));

  const wrapperCls = isFullScreen
    ? "min-h-screen w-full flex justify-center items-center"
    : `${height === "auto" ? "" : height} flex justify-center items-center`;

  const logoStyle = { width: sizeValue, height: sizeValue };

  return (
    <div className={wrapperCls}>
      <div className="relative inline-flex justify-center items-center" style={logoStyle}>
        {showHalo && !reduced && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <motion.img
          src="/logo.webp"
          alt="Loading"
          className={`relative object-contain ${reduced ? "animate-pulse" : ""}`}
          style={logoStyle}
          animate={
            reduced
              ? undefined
              : { rotate: [-6, 6, -6], y: [0, -bounceDy, 0] }
          }
          transition={
            reduced
              ? undefined
              : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </div>
    </div>
  );
}
