"use client";

import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Zap, Check, AlertCircle, Clock, Wifi, Copy, Star, Bell, Search, Send, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 rounded-full" style={{ background: "var(--metal)" }} />
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--metal)" }}>{title}</h2>
        <div className="flex-1 h-px" style={{ background: "var(--metal-border)" }} />
      </div>
      {children}
    </div>
  );
}

export default function DesignSystemPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [inputVal, setInputVal] = useState("");
  const [toggle, setToggle] = useState(false);
  const [slider, setSlider] = useState(65);

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-10">
          <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: "var(--foreground)", fontWeight: 900 }}>Design System</h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Liquid Glass component library — <span style={{ color: "var(--metal)" }}>{isDark ? "Liquid Gold (Dark)" : "Liquid Silver (Light)"}</span>
          </p>
        </div>

        <Section title="Glass Panels">
          <div className="grid grid-cols-3 gap-4">
            <div className="lg-panel rounded-2xl p-5">
              <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" style={{ background: "var(--metal-dim)", border: "1px solid var(--metal-border)" }}>
                <Sparkles size={14} style={{ color: "var(--metal)" }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Standard Panel</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>backdrop-filter blur + specular highlight</p>
            </div>
            <div className="lg-panel-strong rounded-2xl p-5">
              <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" style={{ background: "var(--metal-dim)", border: "1px solid var(--metal-border)" }}>
                <Zap size={14} style={{ color: "var(--metal)" }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Strong Panel</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Higher opacity, deeper blur</p>
            </div>
            <div className="lg-panel rounded-2xl p-5" style={{ background: "var(--metal-dim)", border: "1px solid var(--metal-border)" }}>
              <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" style={{ background: "var(--metal-dim)", border: "1px solid var(--metal-border)" }}>
                <Star size={14} style={{ color: "var(--metal)" }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--metal)" }}>Accent Panel</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Accent-tinted glass surface</p>
            </div>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-3 items-center">
            <button className="lg-btn-accent px-5 py-2.5 rounded-2xl text-sm">Primary Action</button>
            <button className="lg-btn px-5 py-2.5 rounded-2xl text-sm" style={{ color: "var(--foreground)" }}>Glass Button</button>
            <button className="lg-btn px-5 py-2.5 rounded-2xl text-sm" style={{ color: "var(--metal)" }}>Accent Text</button>
            <button className="lg-btn w-10 h-10 rounded-2xl flex items-center justify-center" style={{ color: "var(--metal)" }}><Bell size={16} /></button>
            <button className="lg-btn-accent flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm"><Send size={13} />Send</button>
          </div>
        </Section>

        <Section title="Status Chips">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="chip chip-connected"><Wifi size={9} />Connected</span>
            <span className="chip chip-running"><Loader2 size={9} className="animate-spin" />Running</span>
            <span className="chip chip-done"><Check size={9} />Done</span>
            <span className="chip chip-failed"><AlertCircle size={9} />Failed</span>
            <span className="chip chip-accent"><Zap size={9} />Active</span>
            <span className="chip" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}><Clock size={9} />Queued</span>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="space-y-3 max-w-sm">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
              <input className="lg-input w-full py-2.5 rounded-2xl text-sm" placeholder="Search..." value={inputVal} onChange={e => setInputVal(e.target.value)} style={{ paddingLeft: "2rem" }} />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setToggle(!toggle)} className="relative w-11 h-6 rounded-full transition-all" style={{ background: toggle ? "var(--metal)" : "var(--muted)", boxShadow: toggle ? "0 0 10px var(--metal-glow)" : "none" }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all" style={{ left: toggle ? "calc(100% - 1.375rem)" : "0.125rem" }} />
              </button>
              <span className="text-sm" style={{ color: "var(--foreground)" }}>Enable feature</span>
            </div>
          </div>
        </Section>

        <Section title="Liquid Glass Showcase">
          <div className="relative rounded-3xl overflow-hidden p-6" style={{ background: isDark ? "linear-gradient(135deg, #1a0a30 0%, #0a1020 50%, #200a30 100%)" : "linear-gradient(135deg, #c8d8ff 0%, #e8c8ff 50%, #c8e8ff 100%)", minHeight: 180 }}>
            <div style={{ position: "absolute", top: "10%", left: "15%", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, var(--metal-glow) 0%, transparent 70%)", filter: "blur(20px)" }} />
            <div style={{ position: "absolute", bottom: "15%", right: "20%", width: 80, height: 80, borderRadius: "50%", background: isDark ? "radial-gradient(circle, rgba(120,60,200,0.5) 0%, transparent 70%)" : "radial-gradient(circle, rgba(100,180,255,0.6) 0%, transparent 70%)", filter: "blur(15px)" }} />
            <div className="relative flex gap-4 flex-wrap items-start">
              <div className="lg-btn rounded-2xl px-5 py-3 flex items-center gap-2">
                <Zap size={14} style={{ color: "var(--metal)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Floating Button</span>
              </div>
              <div className="lg-panel rounded-2xl p-4 flex-1 min-w-[160px]">
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--metal)" }}>Glass Card</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Translucent surface with specular highlight and gradient border</p>
              </div>
              <div className="flex flex-col gap-2 justify-center">
                <span className="chip chip-accent"><Sparkles size={9} />Liquid</span>
                <span className="chip chip-connected"><Check size={9} />Glass</span>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

