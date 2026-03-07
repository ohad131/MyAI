"use client";

import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Palette, Server, Cpu, Activity, Download, Globe, Lock,
  Bell, User, Sun, Moon, Wifi, Check, Zap, Key, Brain, Database
} from "lucide-react";
import { toast } from "sonner";
import LiquidButton from "@/components/LiquidButton";

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "models", label: "AI Models", icon: Cpu },
  { id: "connectors", label: "Connectors", icon: Server },
  { id: "diagnostics", label: "Diagnostics", icon: Activity },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme() as any;
  const [activeSection, setActiveSection] = useState("appearance");
  const isDark = theme === "dark";
  

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-52 shrink-0 h-full lg-panel-strong p-3"
        style={{ borderRadius: 0, borderLeft: "none", borderTop: "none", borderBottom: "none", borderRight: `1px solid ${isDark ? "rgba(212,168,67,0.14)" : "rgba(120,140,200,0.2)"}` }}>
        <p className="text-xs font-semibold uppercase tracking-widest px-2 mb-3" style={{ color: "var(--muted-foreground)" }}>Settings</p>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`nav-item w-full mb-0.5 ${activeSection === s.id ? "active" : ""}`}>
            <s.icon size={14} className="shrink-0" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-xl">
          {activeSection === "appearance" && <AppearanceSection isDark={isDark} theme={theme} setTheme={setTheme} />}
          {activeSection === "models" && <ModelsSection isDark={isDark} />}
          {activeSection === "connectors" && <ConnectorsSection isDark={isDark} />}
          {activeSection === "diagnostics" && <DiagnosticsSection isDark={isDark} />}
          {(activeSection === "privacy" || activeSection === "notifications") && (
            <div className="lg-panel rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: "var(--metal-dim)", border: "1px solid var(--metal-border)" }}>
                <Zap size={20} style={{ color: "var(--metal)" }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Coming soon</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>This section is under development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppearanceSection({ isDark, theme, setTheme }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1" style={{ color: "var(--foreground)", fontWeight: 800 }}>Appearance</h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Customize the look and feel of MyAI</p>
      </div>
      <div className="lg-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Theme</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Liquid Gold */}
          <button onClick={() => setTheme("dark")} className="relative rounded-2xl p-4 text-left transition-all"
            style={{ background: theme === "dark" ? "linear-gradient(135deg, rgba(212,168,67,0.2) 0%, rgba(212,168,67,0.08) 100%)" : "rgba(255,255,255,0.04)", border: theme === "dark" ? `2px solid #D4A843` : "2px solid transparent", boxShadow: theme === "dark" ? "0 0 20px rgba(212,168,67,0.25)" : "none" }}>
            <div className="w-full h-14 rounded-xl mb-3 overflow-hidden" style={{ background: "linear-gradient(135deg, #0d0a1a 0%, #120d22 50%, #0a1020 100%)" }}>
              <div className="flex gap-1 p-2"><div className="w-2 h-2 rounded-full" style={{ background: "rgba(212,168,67,0.7)" }} /><div className="flex-1 h-2 rounded" style={{ background: "rgba(212,168,67,0.25)" }} /></div>
              <div className="px-2 space-y-1"><div className="h-1.5 rounded" style={{ background: "rgba(212,168,67,0.35)", width: "70%" }} /><div className="h-1.5 rounded" style={{ background: "rgba(255,255,255,0.08)", width: "50%" }} /></div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-semibold" style={{ color: theme === "dark" ? "#D4A843" : "var(--foreground)" }}>Liquid Gold</p><p className="text-xs" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>Dark mode</p></div>
              {theme === "dark" && <Check size={14} style={{ color: "#D4A843" }} />}
            </div>
          </button>
          {/* Liquid Silver */}
          <button onClick={() => setTheme("light")} className="relative rounded-2xl p-4 text-left transition-all"
            style={{ background: theme === "light" ? "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.06) 100%)" : "rgba(255,255,255,0.04)", border: theme === "light" ? `2px solid #3B82F6` : "2px solid transparent", boxShadow: theme === "light" ? "0 0 20px rgba(59,130,246,0.2)" : "none" }}>
            <div className="w-full h-14 rounded-xl mb-3 overflow-hidden" style={{ background: "linear-gradient(135deg, #e8f0fe 0%, #f0e8ff 50%, #e0f4ff 100%)" }}>
              <div className="flex gap-1 p-2"><div className="w-2 h-2 rounded-full" style={{ background: "rgba(59,130,246,0.8)" }} /><div className="flex-1 h-2 rounded" style={{ background: "rgba(59,130,246,0.3)" }} /></div>
              <div className="px-2 space-y-1"><div className="h-1.5 rounded" style={{ background: "rgba(59,130,246,0.4)", width: "70%" }} /><div className="h-1.5 rounded" style={{ background: "rgba(0,0,0,0.1)", width: "50%" }} /></div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-semibold" style={{ color: theme === "light" ? "#3B82F6" : "var(--foreground)" }}>Liquid Silver</p><p className="text-xs" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>Light mode</p></div>
              {theme === "light" && <Check size={14} style={{ color: "#3B82F6" }} />}
            </div>
          </button>
        </div>
      </div>
      <div className="lg-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Interface Scale</h3>
        <div className="flex gap-2">
          {["Compact", "Default", "Comfortable"].map(s => (
            <button key={s} onClick={() => toast(`Scale: ${s}`)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${s === "Default" ? "lg-btn-accent" : "lg-btn"}`}
              style={{ color: s === "Default" ? "white" : "var(--foreground)" }}>{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModelsSection({ isDark }: any) {
  const models = [
    { name: "GPT-4o", provider: "OpenAI", status: "connected", latency: "320ms" },
    { name: "Claude 3.5 Sonnet", provider: "Anthropic", status: "connected", latency: "280ms" },
    { name: "Gemini 2.0 Flash", provider: "Google", status: "connected", latency: "190ms" },
    { name: "Llama 3.3 70B", provider: "Local (Ollama)", status: "disconnected", latency: "—" },
  ];
  return (
    <div className="space-y-4">
      <div><h2 className="text-lg font-bold mb-1" style={{ color: "var(--foreground)", fontWeight: 800 }}>AI Models</h2><p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Configure model endpoints and API keys</p></div>
      {models.map(m => (
        <div key={m.name} className="lg-panel rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.status === "connected" ? "var(--metal-dim)" : "rgba(239,68,68,0.1)", border: `1px solid ${m.status === "connected" ? "var(--metal-border)" : "rgba(239,68,68,0.25)"}` }}>
            <Cpu size={14} style={{ color: m.status === "connected" ? "var(--metal)" : "#f87171" }} />
          </div>
          <div className="flex-1"><p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{m.name}</p><p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{m.provider}</p></div>
          <span className={`chip ${m.status === "connected" ? "chip-connected" : "chip-failed"}`}>{m.status === "connected" ? <Check size={9} /> : null}{m.status}</span>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{m.latency}</span>
          <button onClick={() => toast(`Configure ${m.name}`)} className="lg-btn w-7 h-7 rounded-xl flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}><Key size={12} /></button>
        </div>
      ))}
    </div>
  );
}

function ConnectorsSection({ isDark }: any) {
  const [urls, setUrls] = useState({ ollama: "http://localhost:11434", n8n: "http://localhost:5678", comfy: "http://localhost:8188" });
  const connectors = [
    { key: "ollama", name: "Ollama", desc: "Local LLM server", connected: false },
    { key: "n8n", name: "n8n", desc: "Workflow automation", connected: true },
    { key: "comfy", name: "ComfyUI", desc: "Image generation", connected: false },
  ];
  return (
    <div className="space-y-4">
      <div><h2 className="text-lg font-bold mb-1" style={{ color: "var(--foreground)", fontWeight: 800 }}>Connectors</h2><p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Connect external services and local servers</p></div>
      {connectors.map(c => (
        <div key={c.key} className="lg-panel rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.connected ? "var(--metal-dim)" : "rgba(255,255,255,0.05)", border: `1px solid ${c.connected ? "var(--metal-border)" : "rgba(255,255,255,0.1)"}` }}>
              <Server size={13} style={{ color: c.connected ? "var(--metal)" : "var(--muted-foreground)" }} />
            </div>
            <div className="flex-1"><p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{c.name}</p><p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.desc}</p></div>
            <span className={`chip ${c.connected ? "chip-connected" : "chip-failed"}`}>{c.connected ? "Connected" : "Offline"}</span>
          </div>
          <div className="flex gap-2">
            <input className="lg-input flex-1 px-3 py-1.5 rounded-xl text-xs font-mono" value={(urls as any)[c.key]} onChange={e => setUrls(u => ({ ...u, [c.key]: e.target.value }))} />
            <button onClick={() => toast(`Testing ${c.name}...`)} className="lg-btn px-3 py-1.5 rounded-xl text-xs" style={{ color: "var(--metal)" }}>Test</button>
            <LiquidButton onClick={() => toast(`${c.name} ${c.connected ? 'disconnected' : 'connecting...'}`)} size="xs">{c.connected ? 'Disconnect' : 'Connect'}</LiquidButton>
          </div>
        </div>
      ))}
    </div>
  );
}

function DiagnosticsSection({ isDark }: any) {
  const stats = [
    { label: "GPU", value: "RTX 4070", usage: 34, color: "#3b82f6" },
    { label: "VRAM", value: "4.2 / 12 GB", usage: 35, color: "var(--metal)" },
    { label: "RAM", value: "11.4 / 32 GB", usage: 36, color: "#10b981" },
    { label: "Disk", value: "124 / 500 GB", usage: 25, color: "#8b5cf6" },
  ];
  return (
    <div className="space-y-4">
      <div><h2 className="text-lg font-bold mb-1" style={{ color: "var(--foreground)", fontWeight: 800 }}>Diagnostics</h2><p className="text-sm" style={{ color: "var(--muted-foreground)" }}>System health and resource usage</p></div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="lg-panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{s.label}</span>
              <span className="text-xs font-mono" style={{ color: s.color }}>{s.usage}%</span>
            </div>
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>{s.value}</div>
            <div className="w-full h-1.5 rounded-full" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${s.usage}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}80)` }} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => toast("Exporting logs...")} className="lg-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm">
        <Download size={14} style={{ color: "var(--metal)" }} />
        <span style={{ color: "var(--foreground)" }}>Export Logs</span>
      </button>
    </div>
  );
}
