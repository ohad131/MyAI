"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutGrid, MessageSquare, Code2, Image, Bot, Brain, Settings,
  Sun, Moon, Wifi, WifiOff, Command, ChevronLeft, ChevronRight,
  Palette, Bell, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import CommandPalette from "./CommandPalette";
import LiquidSvgFilters from "./LiquidSvgFilters";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { checkHealth } from "@/api/chat";

const NAV_ITEMS = [
  { id: "workspaces", label: "Workspaces", icon: LayoutGrid,    path: "/" },
  { id: "chat",       label: "Chat",       icon: MessageSquare, path: "/chat" },
  { id: "code",       label: "Code",       icon: Code2,         path: "/code" },
  { id: "images",     label: "Images",     icon: Image,         path: "/images" },
  { id: "agents",     label: "Agents",     icon: Bot,           path: "/agents" },
  { id: "memory",     label: "Memory",     icon: Brain,         path: "/memory" },
  { id: "settings",   label: "Settings",   icon: Settings,      path: "/settings" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: Route;
}>;

const LOGO_GOLD = "https://d2xsxph8kpxj0f.cloudfront.net/310519663184143728/AQqvN7EgRC28gUL6shAne5/logo-gold-cropped_edd71fae.png";
const LOGO_SILVER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663184143728/AQqvN7EgRC28gUL6shAne5/logo-silver-cropped_83e7ad95.png";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [connected, setConnected] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { workspaces: ctxWorkspaces, activeWorkspace, activeWorkspaceId, setActiveWorkspaceId, models, defaultModel } = useWorkspaceContext();
  const [selectedModel, setSelectedModel] = useState("qwen3.5:9b");
  const [lang, setLang] = useState<"EN" | "HE">("EN");
  const [modelDropOpen, setModelDropOpen] = useState(false);
  const [wsDropOpen, setWsDropOpen] = useState(false);
  const isDark = theme === "dark";
  const currentPath = pathname ?? "/";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const check = () => checkHealth().then(setConnected);
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeWorkspace?.default_chat_model) setSelectedModel(activeWorkspace.default_chat_model);
    else if (defaultModel) setSelectedModel(defaultModel);
  }, [activeWorkspace, defaultModel]);

  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  const logoSrc = isDark ? LOGO_GOLD : LOGO_SILVER;

  return (
    <div
      className="flex h-screen overflow-hidden"
      dir={lang === "HE" ? "rtl" : "ltr"}
      style={{ position: "relative", background: "var(--scene-bg)" }}
    >
      <LiquidSvgFilters />

      {/* SIDEBAR */}
      <aside
        className={`flex flex-col h-full transition-all duration-300 ease-out shrink-0 ${sidebarExpanded ? "w-56" : "w-[52px]"}`}
        style={{
          position: "relative",
          zIndex: 20,
          background: "var(--glass-bg)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          borderRight: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow)",
        }}
      >
        {/* Specular top-left highlight */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "45%",
          background: "var(--specular)",
          pointerEvents: "none", zIndex: 0, borderRadius: "inherit"
        }} />

        {/* Logo */}
        <div
          className={`flex items-center px-3 py-3 shrink-0 relative z-10 ${!sidebarExpanded ? "justify-center" : ""}`}
          style={{ borderBottom: "1px solid var(--glass-border)" }}
        >
          {sidebarExpanded ? (
            <img
              src={logoSrc}
              alt="MyAI"
              style={{ height: "40px", width: "auto", maxWidth: "176px", objectFit: "contain", display: "block" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div style={{ width: "36px", height: "36px", overflow: "hidden" }}>
              <img
                src={logoSrc}
                alt="MyAI"
                style={{ height: "32px", width: "auto", display: "block" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto relative z-10">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className={`nav-item w-full ${isActive(item.path) ? "active" : ""} ${!sidebarExpanded ? "justify-center px-0" : ""}`}
              title={!sidebarExpanded ? item.label : undefined}
            >
              <item.icon size={15} className="shrink-0" />
              {sidebarExpanded && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Design System */}
        <div className="px-2 pb-2 relative z-10">
          <Link
            href="/design-system"
            className={`nav-item w-full ${isActive("/design-system") ? "active" : ""} ${!sidebarExpanded ? "justify-center px-0" : ""}`}
            title={!sidebarExpanded ? "Design System" : undefined}
          >
            <Palette size={15} className="shrink-0" />
            {sidebarExpanded && <span className="text-xs">Design System</span>}
          </Link>
        </div>

        {/* Collapse toggle */}
        <div className="px-2 pb-4 pt-2 relative z-10" style={{ borderTop: "1px solid var(--glass-border)" }}>
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="nav-item w-full justify-center">
            {sidebarExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* TOPBAR */}
        <header
          style={{
            height: 50,
            flexShrink: 0,
            position: "relative",
            zIndex: 10,
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            borderBottom: "1px solid var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
          }}
        >
          {/* Specular top line */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "var(--glass-border-top)", pointerEvents: "none"
          }} />

          <div className="flex items-center gap-2 h-full px-4">

            {/* Workspace selector */}
            <div className="relative">
              <button
                onClick={() => { setWsDropOpen(!wsDropOpen); setModelDropOpen(false); }}
                className="lg-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
                style={{ fontWeight: 450 }}
              >
                <LayoutGrid size={12} style={{ color: "var(--metal)", opacity: 0.8 }} />
                <span style={{ color: "var(--foreground)" }}>{activeWorkspace?.name || "No workspace"}</span>
                <ChevronDown size={10} style={{ color: "var(--muted-foreground)" }} />
              </button>
              {wsDropOpen && (
                <>
                <div className="fixed inset-0 z-40" onClick={() => setWsDropOpen(false)} />
                <div className="absolute top-full mt-1.5 left-0 w-48 lg-panel rounded-xl py-1.5 z-50" style={{ animation: "fade-up 0.15s ease" }}>
                  {ctxWorkspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => { setActiveWorkspaceId(ws.id); setWsDropOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm transition-colors rounded-lg"
                      style={{
                        color: ws.id === activeWorkspaceId ? "var(--metal)" : "var(--foreground)",
                        background: ws.id === activeWorkspaceId ? "var(--metal-dim)" : "transparent",
                        margin: "0 4px", width: "calc(100% - 8px)"
                      }}
                    >
                      {ws.name}
                    </button>
                  ))}
                  {ctxWorkspaces.length === 0 && (
                    <span className="block px-3 py-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>No workspaces</span>
                  )}
                </div>
                </>
              )}
            </div>

            <div className="flex-1" />

            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => { setModelDropOpen(!modelDropOpen); setWsDropOpen(false); }}
                className="lg-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
              >
                <span style={{ color: "var(--muted-foreground)" }}>Model:</span>
                <span style={{ color: "var(--metal)", fontWeight: 600 }}>{selectedModel}</span>
                <ChevronDown size={9} style={{ color: "var(--muted-foreground)" }} />
              </button>
              {modelDropOpen && (
                <>
                <div className="fixed inset-0 z-40" onClick={() => setModelDropOpen(false)} />
                <div className="absolute top-full mt-1.5 right-0 w-44 lg-panel rounded-xl py-1.5 z-50" style={{ animation: "fade-up 0.15s ease" }}>
                  {models.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setModelDropOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm transition-colors rounded-lg"
                      style={{
                        color: m.id === selectedModel ? "var(--metal)" : "var(--foreground)",
                        background: m.id === selectedModel ? "var(--metal-dim)" : "transparent",
                        margin: "0 4px", width: "calc(100% - 8px)"
                      }}
                    >
                      {m.id}
                    </button>
                  ))}
                  {models.length === 0 && (
                    <span className="block px-3 py-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>Loading models...</span>
                  )}
                </div>
                </>
              )}
            </div>

            {/* Lang toggle */}
            <button
              onClick={() => setLang(l => l === "EN" ? "HE" : "EN")}
              className="lg-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold"
              style={{ color: lang === "HE" ? "var(--metal)" : "var(--muted-foreground)", letterSpacing: "0.04em" }}
            >
              {lang}
            </button>

            {/* Connection status */}
            <div
              className="chip"
              style={{
                background: connected ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                borderColor: connected ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)",
                color: connected ? "#22c55e" : "#ef4444",
              }}
            >
              {connected ? <Wifi size={9} /> : <WifiOff size={9} />}
              {connected ? "Connected" : "Offline"}
            </div>

            {/* Command palette */}
            <button
              onClick={() => setCmdOpen(true)}
              className="lg-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs"
              title="Ctrl+K"
            >
              <Command size={12} style={{ color: "var(--muted-foreground)" }} />
              <span className="hidden sm:inline" style={{ color: "var(--muted-foreground)" }}>Cmd+K</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => toast("No new notifications")}
              className="lg-btn w-8 h-8 flex items-center justify-center rounded-xl"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Bell size={13} />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="lg-btn w-8 h-8 flex items-center justify-center rounded-xl"
              style={{ color: "var(--muted-foreground)" }}
              title={isDark ? "Switch to Light" : "Switch to Dark"}
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 cursor-pointer"
              style={{
                background: "var(--metal-dim)",
                color: "var(--metal)",
                border: "1px solid var(--metal-border)",
              }}
            >
              O
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
    </div>
  );
}
