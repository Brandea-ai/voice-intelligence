"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LazyStore } from "@tauri-apps/plugin-store";

interface Settings {
  alwaysOnTop: boolean;
  showThemeToggle: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  alwaysOnTop: true,
  showThemeToggle: false,
};

const store = new LazyStore("settings.json");

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const alwaysOnTop = await store.get<boolean>("alwaysOnTop");
        const showThemeToggle = await store.get<boolean>("showThemeToggle");

        const loadedSettings: Settings = {
          alwaysOnTop: alwaysOnTop ?? DEFAULT_SETTINGS.alwaysOnTop,
          showThemeToggle: showThemeToggle ?? DEFAULT_SETTINGS.showThemeToggle,
        };

        setSettings(loadedSettings);

        // Apply always on top setting
        const appWindow = getCurrentWindow();
        await appWindow.setAlwaysOnTop(loadedSettings.alwaysOnTop);

        setIsLoaded(true);
      } catch (error) {
        console.error("Einstellungen laden fehlgeschlagen:", error);
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const setAlwaysOnTop = useCallback(async (value: boolean) => {
    try {
      await store.set("alwaysOnTop", value);
      await store.save();

      const appWindow = getCurrentWindow();
      await appWindow.setAlwaysOnTop(value);

      setSettings((prev) => ({ ...prev, alwaysOnTop: value }));
    } catch (error) {
      console.error("Always on top setzen fehlgeschlagen:", error);
    }
  }, []);

  const toggleAlwaysOnTop = useCallback(async () => {
    await setAlwaysOnTop(!settings.alwaysOnTop);
  }, [settings.alwaysOnTop, setAlwaysOnTop]);

  const setShowThemeToggle = useCallback(async (value: boolean) => {
    try {
      await store.set("showThemeToggle", value);
      await store.save();
      setSettings((prev) => ({ ...prev, showThemeToggle: value }));
    } catch (error) {
      console.error("Theme Toggle Einstellung setzen fehlgeschlagen:", error);
    }
  }, []);

  const toggleShowThemeToggle = useCallback(async () => {
    await setShowThemeToggle(!settings.showThemeToggle);
  }, [settings.showThemeToggle, setShowThemeToggle]);

  return {
    settings,
    isLoaded,
    setAlwaysOnTop,
    toggleAlwaysOnTop,
    setShowThemeToggle,
    toggleShowThemeToggle,
  };
}
