"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeMode = Theme | "system";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (t: ThemeMode) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  switchable?: boolean;
}

function resolveTheme(mode: ThemeMode): Theme {
  if (mode === "system") {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  }
  return mode;
}

function readInitialThemeMode(defaultTheme: ThemeMode): ThemeMode {
  if (typeof window === "undefined") return defaultTheme;
  try {
    const stored = localStorage.getItem("myai-theme");
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : defaultTheme;
  } catch {
    return defaultTheme;
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  switchable = true,
}: ThemeProviderProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(defaultTheme);
  const [theme, setResolvedTheme] = useState<Theme>(
    defaultTheme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    setThemeMode(readInitialThemeMode(defaultTheme));
  }, [defaultTheme]);

  useEffect(() => {
    if (themeMode !== "system") {
      setResolvedTheme(themeMode);
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystemTheme = () =>
      setResolvedTheme(mediaQuery.matches ? "dark" : "light");

    applySystemTheme();
    mediaQuery.addEventListener("change", applySystemTheme);
    return () => {
      mediaQuery.removeEventListener("change", applySystemTheme);
    };
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.dataset.themeMode = themeMode;
    try {
      localStorage.setItem("myai-theme", themeMode);
    } catch {
      /* localStorage unavailable */
    }
  }, [theme, themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const resolvedCurrentTheme = prev === "system" ? theme : prev;
      return resolvedCurrentTheme === "dark" ? "light" : "dark";
    });
  };

  const setTheme = (mode: ThemeMode) => setThemeMode(mode);

  return (
    <ThemeContext.Provider
      value={{ theme, themeMode, toggleTheme, setTheme, switchable }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
