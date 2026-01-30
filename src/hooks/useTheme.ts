/**
 * System Theme Hook
 * Erkennt automatisch Hell/Dunkel-Modus des Systems
 */

import { useState, useEffect } from "react";

export type Theme = "light" | "dark";

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setTheme(e.matches ? "dark" : "light");
    };

    handleChange(mediaQuery);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return theme;
}
