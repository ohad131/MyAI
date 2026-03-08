"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search, LayoutGrid, MessageSquare, Code2, Image, Bot, Brain,
  Settings, Palette, Plus, Moon, Sun, Command, ArrowRight
} from "lucide-react";

const COMMANDS = [
  { id: "ws",      label: "Go to Workspaces",    icon: LayoutGrid,    path: "/",             shortcut: "G W" },
  { id: "chat",    label: "Go to Chat",           icon: MessageSquare, path: "/chat",         shortcut: "G C" },
  { id: "code",    label: "Go to Code",           icon: Code2,         path: "/code",         shortcut: "G K" },
  { id: "images",  label: "Go to Images",         icon: Image,         path: "/images",       shortcut: "G I" },
  { id: "agents",  label: "Go to Agents",         icon: Bot,           path: "/agents",       shortcut: "G A" },
  { id: "memory",  label: "Go to Memory",         icon: Brain,         path: "/memory",       shortcut: "G M" },
  { id: "settings",label: "Go to Settings",       icon: Settings,      path: "/settings",     shortcut: "G S" },
  { id: "ds",      label: "Design System",        icon: Palette,       path: "/design-system",shortcut: "" },
  { id: "new-chat",label: "New Chat",             icon: Plus,          path: "/chat",         shortcut: "N C" },
  { id: "new-ws",  label: "New Workspace",        icon: Plus,          path: "/",             shortcut: "N W" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  path: Route;
  shortcut: string;
}>;

interface Props {
  onClose: () => void;
}

export default function CommandPalette({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === "dark";
  

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setSelected(s => Math.min(s + 1, filtered.length - 1));
      if (e.key === "ArrowUp") setSelected(s => Math.max(s - 1, 0));
      if (e.key === "Enter" && filtered[selected]) {
        router.push(filtered[selected].path);
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, selected, onClose, router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 animate-blur-in"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ border: "1px solid var(--metal-border)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="text-xs px-1.5 py-0.5 rounded text-muted-foreground" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div className="py-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No commands found</div>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => { router.push(cmd.path); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
              style={{
                background: i === selected ? (isDark ? "rgba(212,168,67,0.1)" : "rgba(59,130,246,0.08)") : "transparent",
                color: i === selected ? "var(--metal)" : "var(--foreground)"
              }}
              onMouseEnter={() => setSelected(i)}
            >
              <cmd.icon size={15} style={{ color: i === selected ? "var(--metal)" : "var(--muted-foreground)" }} />
              <span className="flex-1 text-left">{cmd.label}</span>
              {cmd.shortcut && (
                <span className="text-xs text-muted-foreground font-mono">{cmd.shortcut}</span>
              )}
              {i === selected && <ArrowRight size={13} style={{ color: "var(--metal)" }} />}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Command size={10} />K to open</span>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>ESC close</span>
          <div className="flex-1" />
          <button onClick={toggleTheme} className="flex items-center gap-1 hover:text-foreground transition-colors">
            {isDark ? <Sun size={11} /> : <Moon size={11} />}
            {isDark ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </div>
  );
}

