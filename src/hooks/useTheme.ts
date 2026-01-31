"use client";

import { useState, useEffect, useCallback } from "react";
import { LazyStore } from "@tauri-apps/plugin-store";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
}

const store = new LazyStore("settings.json");

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return getSystemTheme();
  }
  return mode;
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeState>({
    mode: "system",
    resolved: "dark",
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Apply theme to document
  const applyTheme = useCallback((resolved: ResolvedTheme) => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.setAttribute("data-theme", resolved);
  }, []);

  // Load saved theme and set up system listener
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await store.get<ThemeMode>("themeMode");
        const mode = savedMode ?? "system";
        const resolved = resolveTheme(mode);

        setTheme({ mode, resolved });
        applyTheme(resolved);
        setIsLoaded(true);
      } catch (error) {
        console.error("Theme laden fehlgeschlagen:", error);
        const resolved = getSystemTheme();
        setTheme({ mode: "system", resolved });
        applyTheme(resolved);
        setIsLoaded(true);
      }
    };

    loadTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      setTheme((prev) => {
        if (prev.mode === "system") {
          const newResolved = e.matches ? "dark" : "light";
          applyTheme(newResolved);
          return { ...prev, resolved: newResolved };
        }
        return prev;
      });
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [applyTheme]);

  const setThemeMode = useCallback(
    async (mode: ThemeMode) => {
      try {
        await store.set("themeMode", mode);
        await store.save();

        const resolved = resolveTheme(mode);
        setTheme({ mode, resolved });
        applyTheme(resolved);
      } catch (error) {
        console.error("Theme setzen fehlgeschlagen:", error);
      }
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(async () => {
    // Cycle: system -> light -> dark -> system
    const nextMode: ThemeMode =
      theme.mode === "system" ? "light" : theme.mode === "light" ? "dark" : "system";
    await setThemeMode(nextMode);
  }, [theme.mode, setThemeMode]);

  return {
    mode: theme.mode,
    resolved: theme.resolved,
    isDark: theme.resolved === "dark",
    isLight: theme.resolved === "light",
    isLoaded,
    setThemeMode,
    toggleTheme,
  };
}
