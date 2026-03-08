"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("myai-theme");
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
      } else {
        const domTheme = document.documentElement.classList.contains("light")
          ? "light"
          : document.documentElement.classList.contains("dark")
            ? "dark"
            : defaultTheme;
        setThemeState(domTheme);
      }
    } catch {
      setThemeState(defaultTheme);
    } finally {
      setHydrated(true);
    }
  }, [defaultTheme]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    try { localStorage.setItem("myai-theme", theme); } catch {}
  }, [theme, hydrated]);

  const toggleTheme = () => setThemeState(prev => prev === "light" ? "dark" : "light");
  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
