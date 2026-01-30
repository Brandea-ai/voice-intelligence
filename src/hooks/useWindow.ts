/**
 * Window Control Hook
 * Steuert das Tauri-Fenster (verstecken, zeigen, etc.)
 */

import { useEffect, useCallback } from "react";

export function useWindow() {
  const hideWindow = useCallback(async () => {
    if (typeof window !== "undefined" && window.__TAURI__) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.hide();
    }
  }, []);

  const showWindow = useCallback(async () => {
    if (typeof window !== "undefined" && window.__TAURI__) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.show();
      await appWindow.setFocus();
    }
  }, []);

  const centerWindow = useCallback(async () => {
    if (typeof window !== "undefined" && window.__TAURI__) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const appWindow = getCurrentWindow();
      await appWindow.center();
    }
  }, []);

  // Escape-Taste zum Verstecken
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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
