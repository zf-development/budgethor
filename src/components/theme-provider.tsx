"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { THEME_STORAGE_KEY } from "@/lib/theme-script";

export type AppTheme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: AppTheme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: AppTheme) => void;
  themes: AppTheme[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeClass(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

function readStoredTheme(): AppTheme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* ignore */
  }
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const setTheme = useCallback((next: AppTheme) => {
    const resolved = next === "system" ? systemTheme() : next;
    setThemeState(next);
    setResolvedTheme(resolved);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyThemeClass(resolved);
  }, []);

  useEffect(() => {
    setTheme(readStoredTheme());
  }, [setTheme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme === "system") setTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      themes: ["light", "dark", "system"] as AppTheme[],
    }),
    [resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "light" as const,
      resolvedTheme: "light" as const,
      setTheme: () => {},
      themes: ["light", "dark", "system"] as AppTheme[],
    };
  }
  return context;
}
