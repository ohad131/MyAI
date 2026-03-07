"use client";

import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Search, Filter, Pin, CheckCircle2, XCircle, Edit3,
  Trash2, AlertTriangle, Brain, Clock, Tag, ChevronDown,
  Plus, Star, BarChart3
} from "lucide-react";
import { toast } from "sonner";

const MEMORY_ITEMS = [
  { id: "1", content: "User is based in Jerusalem, Israel (IST timezone)", source: "Profile", confidence: 0.99, date: "Mar 1", pinned: true, tab: "pinned", tags: ["profile"] },
  { id: "2", content: "Prefers structured answers with bullets, numbered steps, and quick summaries", source: "Chat #12", confidence: 0.95, date: "Mar 2", pinned: true, tab: "pinned", tags: ["preference"] },
  { id: "3", content: "Trades options on NASDAQ tech stocks, interested in RSI and momentum strategies", source: "Chat #34", confidence: 0.92, date: "Mar 3", pinned: false, tab: "auto", tags: ["trading", "finance"] },
  { id: "4", content: "Uses n8n and Activepieces for automation workflows", source: "Chat #8", confidence: 0.90, date: "Mar 3", pinned: false, tab: "auto", tags: ["tools", "automation"] },
  { id: "5", content: "Studies Economics & Management, finishing AI Systems Implementation course", source: "Profile", confidence: 0.98, date: "Mar 1", pinned: false, tab: "auto", tags: ["education"] },
  { id: "6", content: "Comfortable with JavaScript/TypeScript, Docker, Redis, PostgreSQL", source: "Chat #21", confidence: 0.88, date: "Mar 4", pinned: false, tab: "auto", tags: ["skills", "code"] },
  { id: "7", content: "Worked as mechanical designer in IDF, mechatronics background", source: "Profile", confidence: 0.97, date: "Mar 1", pinned: false, tab: "auto", tags: ["background"] },
  { id: "8", content: "Interested in entrepreneurship at intersection of AI, business, and investing", source: "Chat #45", confidence: 0.85, date: "Mar 5", pinned: false, tab: "auto", tags: ["interests"] },
];

export default function MemoryPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"auto" | "pinned">("auto");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState(MEMORY_ITEMS);
  const [showDanger, setShowDanger] = useState(false);
  const isDark = theme === "dark";
  

  const filtered = items.filter(item =>
    item.tab === activeTab &&
    (item.content.toLowerCase().includes(search.toLowerCase()) ||
     item.tags.some(t => t.includes(search.toLowerCase())))
  );

  const approve = (id: string) => { toast.success("Memory approved"); };
  const reject = (id: string) => { setItems(prev => prev.filter(i => i.id !== id)); toast("Memory removed"); };
  const pin = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, pinned: !i.pinned, tab: i.pinned ? "auto" : "pinned" } : i));
    toast("Memory pinned");
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.95) return "#22c55e";
    if (c >= 0.85) return "var(--metal)";
    return "#f59e0b";
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1" style={{ fontWeight: 700 }}>Memory Manager</h1>
            <p className="text-sm text-muted-foreground">AI-captured knowledge about you and your preferences</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <Brain size={13} style={{ color: "var(--metal)" }} />
              <span className="text-sm font-semibold text-foreground">{items.length}</span>
              <span className="text-xs text-muted-foreground">memories</span>
            </div>
            <button onClick={() => toast("Add memory")} className="btn-accent flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold shimmer-hover" style={{ background: "var(--metal)" }}>
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {(["auto", "pinned"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 text-sm font-medium transition-all capitalize"
                style={{
                  background: activeTab === tab ? (isDark ? "rgba(212,168,67,0.12)" : "rgba(59,130,246,0.1)") : "transparent",
                  color: activeTab === tab ? "var(--metal)" : "var(--muted-foreground)"
                }}
              >
                {tab === "auto" ? "Auto-captured" : "Pinned"}
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                  {items.filter(i => i.tab === tab).length}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <Search size={13} className="text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <button onClick={() => toast("Filter memories")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all hover:bg-accent" style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
            <Filter size={13} />
            Filter
          </button>
        </div>

        {/* Memory Cards */}
        <div className="space-y-2 mb-8">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No memories found</div>
          )}
          {filtered.map(item => (
            <div
              key={item.id}
              className="group flex items-start gap-4 px-4 py-3.5 rounded-2xl transition-all"
              style={{
                background: isDark ? "rgba(20,18,14,0.8)" : "rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border)"
              }}
            >
              {/* Confidence bar */}
              <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                <div className="w-1 h-10 rounded-full" style={{ background: "var(--border)" }}>
                  <div className="w-full rounded-full transition-all" style={{ height: `${item.confidence * 100}%`, background: confidenceColor(item.confidence) }} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed mb-2">{item.content}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag size={10} />
                    {item.source}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={10} />
                    {item.date}
                  </span>
                  <span className="text-xs font-mono" style={{ color: confidenceColor(item.confidence) }}>
                    {Math.round(item.confidence * 100)}% confidence
                  </span>
                  {item.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--metal-dim)", color: "var(--metal)", border: "1px solid var(--metal-border)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <button onClick={() => approve(item.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-all" style={{ color: "#22c55e" }} title="Approve">
                  <CheckCircle2 size={13} />
                </button>
                <button onClick={() => pin(item.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-all" style={{ color: item.pinned ? "var(--metal)" : "var(--muted-foreground)" }} title="Pin">
                  <Pin size={13} />
                </button>
                <button onClick={() => toast("Editing memory...")} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-all" style={{ color: "var(--muted-foreground)" }} title="Edit">
                  <Edit3 size={13} />
                </button>
                <button onClick={() => reject(item.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-all" style={{ color: "#ef4444" }} title="Remove">
                  <XCircle size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
          <button
            onClick={() => setShowDanger(!showDanger)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all"
            style={{ background: "rgba(239,68,68,0.06)", color: "#ef4444" }}
          >
            <span className="flex items-center gap-2">
              <AlertTriangle size={14} />
              Danger Zone
            </span>
            <ChevronDown size={14} className={`transition-transform ${showDanger ? "rotate-180" : ""}`} />
          </button>
          {showDanger && (
            <div className="px-4 py-4" style={{ background: "rgba(239,68,68,0.03)" }}>
              <p className="text-sm text-muted-foreground mb-3">
                Permanently delete all memory for this workspace. This action cannot be undone.
              </p>
              <button
                onClick={() => { toast.error("All workspace memory cleared"); setItems([]); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
              >
                <Trash2 size={13} />
                Clear workspace memory
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

