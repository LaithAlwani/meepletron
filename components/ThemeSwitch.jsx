"use client";
import { FiSun, FiMoon } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Loader from "./Loader";

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <Loader width={"1rem"}/>

  if (resolvedTheme === "dark") {
    return <FiSun size={24} onClick={() => setTheme("light")} />;
  }
  if (resolvedTheme === "light") {
    return <FiMoon size={24} onClick={() => setTheme("dark")} />;
  }
}
