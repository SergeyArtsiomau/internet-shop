"use client";

import { useThemeStore } from "@/store/theme-store";
import { useEffect } from "react";

export function ThemeSwitchListener() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const html = document.documentElement;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches;

    html.classList.remove("light", "dark");

    if (theme === "system") {
      if (prefersDark) html.classList.add("dark");
      else html.classList.add("light");
      return;
    }

    html.classList.add(theme);
  }, [theme]);

  return null;
}
