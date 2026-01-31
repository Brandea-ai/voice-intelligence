/**
 * Window Control Hook
 * Steuert das Tauri-Fenster (verstecken, zeigen, etc.)
 */

import { useEffect, useCallback } from "react";

// Tauri v2 Erkennung (konsistent mit VoiceCommandBar)
const isTauri = (): boolean => {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window || "isTauri" in window;
};

export function useWindow() {
  const hideWindow = useCallback(async () => {
    if (isTauri()) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.hide();
    }
  }, []);

  const showWindow = useCallback(async () => {
    if (isTauri()) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.show();
      await appWindow.setFocus();
    }
  }, []);

  const centerWindow = useCallback(async () => {
    if (isTauri()) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.center();
    }
  }, []);

  // Escape-Taste zum Verstecken
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        hideWindow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hideWindow]);

  return {
    hideWindow,
    showWindow,
    centerWindow,
  };
}
