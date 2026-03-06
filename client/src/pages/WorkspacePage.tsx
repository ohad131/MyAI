import { useState, useRef, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import {
  Plus, Search, Pin, MessageSquare, Code2, Image, Bot,
  MoreHorizontal, Clock, Zap, Globe, Sparkles, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import LiquidButton from "@/components/LiquidButton";

const WORKSPACES = [
  { id: "1", name: "Personal Assistant",   description: "Daily tasks, notes, and personal AI workflows",         pinned: true,  lastUsed: "2 min ago",  chats: 24, model: "GPT-4o",     tags: ["personal", "productivity"] },
  { id: "2", name: "Work — Dev Projects",  description: "Code review, architecture discussions, debugging",     pinned: true,  lastUsed: "1 hour ago", chats: 87, model: "Claude 3.5", tags: ["work", "code"] },
  { id: "3", name: "Research & Analysis",  description: "Market research, data analysis, academic papers",      pinned: false, lastUsed: "Yesterday",  chats: 31, model: "Gemini 2.0", tags: ["research"] },
  { id: "4", name: "Creative Writing",     description: "Stories, scripts, content creation, brainstorming",   pinned: false, lastUsed: "3 days ago", chats: 12, model: "GPT-4o",     tags: ["creative"] },
  { id: "5", name: "Trading & Finance",    description: "Market analysis, strategy development, portfolio",     pinned: false, lastUsed: "5 days ago", chats: 19, model: "GPT-4o",     tags: ["finance"] },
  { id: "6", name: "AI Automation",        description: "n8n flows, agent design, workflow automation",         pinned: false, lastUsed: "1 week ago", chats: 43, model: "Claude 3.5", tags: ["automation"] },
];

const QUICK_ACTIONS = [
  { icon: MessageSquare, label: "New Chat",       path: "/chat" },
  { icon: Code2,         label: "Code Review",    path: "/code" },
  { icon: Image,         label: "Generate Image", path: "/images" },
  { icon: Bot,           label: "Run Agent",      path: "/agents" },
];

export default function WorkspacePage() {
  const { theme } = useTheme();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const isDark = theme === "dark";

  const filtered = WORKSPACES.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.description.toLowerCase().includes(search.toLowerCase())
  );
  const pinned = filtered.filter(w => w.pinned);
  const recent = filtered.filter(w => !w.pinned);

  return (
    <div className="h-full overflow-y-auto lg-scroll" style={{ scrollbarGutter: "stable" }}>
      <div className="max-w-4xl mx-auto px-8 pt-8 pb-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-7" style={{ overflow: "visible" }}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}>
              Workspaces
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Manage your AI contexts and conversations
            </p>
          </div>
          <LiquidButton
            onClick={() => toast("Create workspace — coming soon")}
            size="sm"
          >
            <Plus size={12} />
            New workspace
          </LiquidButton>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
          <input
            className="lg-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            placeholder="Search workspaces..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {QUICK_ACTIONS.map(({ icon: Icon, label, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="lg-btn flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
            >
              <Icon size={14} style={{ color: "var(--metal)", opacity: 0.85 }} />
              <span style={{ color: "var(--foreground)", fontWeight: 450 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Pinned */}
        {pinned.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Pin size={11} style={{ color: "var(--metal)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", letterSpacing: "0.08em" }}>Pinned</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {pinned.map((ws, i) => (
                <WorkspaceCard key={ws.id} ws={ws} index={i} onClick={() => navigate("/chat")} />
              ))}
            </div>
          </section>
        )}

        {/* Recent */}
        {recent.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={11} style={{ color: "var(--muted-foreground)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", letterSpacing: "0.08em" }}>Recent</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {recent.map((ws, i) => (
                <WorkspaceCard key={ws.id} ws={ws} index={pinned.length + i} onClick={() => navigate("/chat")} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function WorkspaceCard({ ws, onClick, index = 0 }: { ws: typeof WORKSPACES[0], onClick: () => void, index?: number }) {
  const [hovered, setHovered] = useState(false);
  const [shimActive, setShimActive] = useState(false);
  const shimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    // Reset and re-trigger shimmer on each hover
    setShimActive(false);
    if (shimTimerRef.current) clearTimeout(shimTimerRef.current);
    shimTimerRef.current = setTimeout(() => setShimActive(true), 10);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    // Let shimmer finish its 0.9s animation, then reset class
    if (shimTimerRef.current) clearTimeout(shimTimerRef.current);
    shimTimerRef.current = setTimeout(() => setShimActive(false), 950);
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      className="lg-panel rounded-xl p-4 text-left cursor-pointer ws-card-enter"
      onClick={onClick}
      onKeyDown={e => e.key === "Enter" && onClick()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease, box-shadow 0.2s ease",
        animationDelay: `${index * 60}ms`,
        boxShadow: hovered
          ? `var(--glass-shadow-hover), 0 0 0 1px var(--metal-border)`
          : `var(--glass-shadow)`,
      }}
    >
      {/* Shimmer sweep — diagonal band that passes once on hover */}
      <div className={`ws-card-shimmer${shimActive ? " active" : ""}`} />

      {/* Subtle top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent 0%, var(--metal-border) 30%, var(--metal-border) 70%, transparent 100%)",
        opacity: ws.pinned ? 1 : 0.4
      }} />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            color: "var(--muted-foreground)"
          }}
        >
          {ws.name[0]}
        </div>
        <div className="flex items-center gap-1.5">
          {ws.pinned && <Pin size={10} style={{ color: "var(--metal)", opacity: 0.7 }} />}
          <button
            onClick={e => { e.stopPropagation(); toast("Options — coming soon"); }}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--glass-bg)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <MoreHorizontal size={12} />
          </button>
        </div>
      </div>

      <h3 className="text-sm font-medium mb-1" style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}>
        {ws.name}
      </h3>
      <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--muted-foreground)", lineHeight: 1.55 }}>
        {ws.description}
      </p>

      <div className="flex flex-wrap gap-1 mb-3">
        {ws.tags.map(t => (
          <span key={t} className="chip" style={{ fontSize: "0.6rem", padding: "0.1rem 0.45rem" }}>{t}</span>
        ))}
      </div>

      <div className="flex items-center justify-between" style={{ color: "var(--muted-foreground)", fontSize: "0.7rem" }}>
        <span className="flex items-center gap-1"><MessageSquare size={9} /> {ws.chats}</span>
        <span className="flex items-center gap-1"><Zap size={9} /> {ws.model}</span>
        <span className="flex items-center gap-1"><Clock size={9} /> {ws.lastUsed}</span>
      </div>
    </div>
  );
}
