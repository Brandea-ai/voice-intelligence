"use client";

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useTheme, ThemeMode } from "@/hooks/useTheme";
import { useSettings } from "@/hooks/useSettings";

export function useMenuEvents() {
  const { setThemeMode } = useTheme();
  const { setAlwaysOnTop } = useSettings();

  useEffect(() => {
    // Theme-Änderungen vom Menü
    const unlistenTheme = listen<string>("menu-theme-change", (event) => {
      const theme = event.payload as ThemeMode;
      setThemeMode(theme);
    });

    // Always-on-Top Änderung vom Menü (mit neuem Wert)
    const unlistenAlwaysOnTop = listen<boolean>("menu-always-on-top-changed", (event) => {
      setAlwaysOnTop(event.payload);
    });

    return () => {
      unlistenTheme.then((fn) => fn());
      unlistenAlwaysOnTop.then((fn) => fn());
    };
  }, [setThemeMode, setAlwaysOnTop]);
}
