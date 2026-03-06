import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Plus, Search, Folder, MessageSquare, Send, Paperclip, Mic,
  Brain, ChevronRight, Copy, RotateCcw, Edit3,
  Globe, Image, Cpu, Zap, X, BookOpen, FileText,
  ListChecks, Languages, ChevronDown, Hash, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import LiquidButton from "@/components/LiquidButton";

const CONVERSATIONS = [
  { id: "1", title: "Market analysis Q1 2026", preview: "Let me analyze the current...", time: "2m", folder: "Trading", active: true },
  { id: "2", title: "n8n webhook automation", preview: "Here's how to set up the...", time: "1h", folder: "Dev" },
  { id: "3", title: "React performance tips", preview: "For large React apps, consider...", time: "3h", folder: "Dev" },
  { id: "4", title: "Business plan outline", preview: "Executive Summary: The company...", time: "Yesterday", folder: null },
  { id: "5", title: "Hebrew content draft", preview: "כאן נכתוב את התוכן...", time: "2d", folder: "Personal" },
  { id: "6", title: "Trading strategy review", preview: "Based on the RSI divergence...", time: "3d", folder: "Trading" },
];

const MESSAGES = [
  { id: "1", role: "user", content: "Can you analyze the current market conditions for tech stocks and give me key levels to watch?", time: "14:23" },
  {
    id: "2", role: "assistant",
    content: `## Market Analysis — Tech Sector\n\nBased on current market conditions, here are the key levels to watch:\n\n### NASDAQ (QQQ)\n- **Resistance:** 520–525 zone (previous ATH)\n- **Support:** 498–502 (50-day MA confluence)\n- **Trend:** Bullish above 505, bearish below 495\n\n### Key Observations\n1. **Momentum:** RSI at 62 — room to run but approaching overbought\n2. **Volume:** Above-average buying pressure last 3 sessions\n3. **Risk:** Fed meeting next week — expect volatility\n\n\`\`\`\nEntry zone:  505–508\nStop loss:   494\nTarget 1:    520\nTarget 2:    535\nR/R ratio:   ~2.5:1\n\`\`\`\n\n> **Note:** This is educational analysis only. Always manage risk appropriately.`,
    time: "14:24", citations: ["Bloomberg", "TradingView"]
  },
  { id: "3", role: "user", content: "What about the semiconductor sector specifically?", time: "14:26" },
  {
    id: "4", role: "assistant",
    content: `## Semiconductor Sector (SOXX)\n\n**Current Status:** Consolidating after recent breakout\n\n| Stock | Support | Resistance | Trend |\n|-------|---------|------------|-------|\n| NVDA  | 820     | 875        | ↑ Bull |\n| AMD   | 155     | 175        | → Neutral |\n| INTC  | 42      | 48         | ↓ Bear |\n\n**Key catalyst:** AI chip demand remains strong. Watch NVDA earnings next month.`,
    time: "14:27", citations: ["SOXX ETF", "Seeking Alpha"]
  },
];

const TOOLS = [
  { icon: Globe, label: "Web Search" },
  { icon: Image, label: "Generate Image" },
  { icon: Cpu, label: "Run Code" },
  { icon: FileText, label: "Read File" },
  { icon: Brain, label: "Memory" },
];

export default function ChatPage() {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(MESSAGES);
  const [activeConv, setActiveConv] = useState("1");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const isDark = theme === "dark";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: String(Date.now()), role: "user", content: input, time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { id: String(Date.now() + 1), role: "assistant", content: "I'm processing your request. This is a UI demo — connect a real LLM endpoint in Settings to get live responses.", time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }]);
    }, 800);
  };

  return (
    <div className="flex h-full">
      {/* ── Conversation List ── */}
      {sidebarOpen && (
        <div className="w-64 flex flex-col h-full shrink-0 lg-panel-strong animate-fade-in-up"
          style={{ borderRadius: 0, borderLeft: "none", borderTop: "none", borderBottom: "none", borderRight: "1px solid var(--glass-border)" }}>
          <div className="p-3 shrink-0" style={{ borderBottom: "1px solid var(--glass-border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold flex-1" style={{ color: "var(--foreground)" }}>Conversations</span>
              <button onClick={() => toast("New conversation")} className="lg-btn w-7 h-7 rounded-xl flex items-center justify-center" style={{ color: "var(--metal)" }}>
                <Plus size={13} />
              </button>
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
              <input className="lg-input w-full pl-7 pr-2 py-1.5 rounded-xl text-xs" placeholder="Search..." style={{ paddingLeft: "1.75rem" }} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {CONVERSATIONS.map(conv => (
              <button key={conv.id} onClick={() => setActiveConv(conv.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-all ${conv.id === activeConv ? "active" : ""}`}
                style={{
                  background: conv.id === activeConv ? "var(--metal-dim)" : "transparent",
                  border: conv.id === activeConv ? "1px solid var(--metal-border)" : "1px solid transparent",
                  boxShadow: conv.id === activeConv ? "0 0 10px var(--metal-glow)" : "none"
                }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium truncate" style={{ color: conv.id === activeConv ? "var(--metal)" : "var(--foreground)" }}>{conv.title}</span>
                  <span className="text-xs shrink-0 ml-1" style={{ color: "var(--muted-foreground)", fontSize: "0.6rem" }}>{conv.time}</span>
                </div>
                <p className="text-xs truncate" style={{ color: "var(--muted-foreground)", fontSize: "0.7rem" }}>{conv.preview}</p>
                {conv.folder && (
                  <span className="text-xs mt-1 inline-flex items-center gap-0.5" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>
                    <Folder size={9} /> {conv.folder}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Chat ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Chat header */}
        <div className="lg-panel shrink-0 px-4 py-2.5 flex items-center gap-3"
           style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none", borderBottom: "1px solid var(--glass-border)" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg-btn w-7 h-7 rounded-xl flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
            <ChevronRight size={13} style={{ transform: sidebarOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          <div className="flex-1">
            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Market analysis Q1 2026</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setToolsOpen(!toolsOpen)} className="lg-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs" style={{ color: "var(--metal)" }}>
              <Zap size={11} /> Tools
            </button>
            <button onClick={() => setContextOpen(!contextOpen)} className="lg-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs" style={{ color: "var(--muted-foreground)" }}>
              <Brain size={11} /> Context
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mr-3 mt-0.5"
                  style={{ background: "var(--metal-dim)", border: "1px solid var(--metal-border)", boxShadow: "0 0 8px var(--metal-glow)" }}>
                  <Sparkles size={12} style={{ color: "var(--metal)" }} />
                </div>
              )}
              <div className={`max-w-[72%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div
                  className="lg-panel rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background: msg.role === "user"
                      ? "var(--metal-dim)"
                      : "var(--glass-bg)",
                    borderColor: msg.role === "user" ? "var(--metal-border)" : undefined,
                    boxShadow: msg.role === "user" ? "0 4px 20px var(--metal-glow), inset 0 1px 0 rgba(255,255,255,0.15)" : undefined,
                    color: "var(--foreground)",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                  }}
                >
                  {msg.content}
                  {(msg as any).citations && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2" style={{ borderTop: isDark ? '1px solid rgba(212,168,67,0.15)' : '1px solid rgba(120,140,200,0.2)' }}>
                      {(msg as any).citations.map((c: string) => (
                        <span key={c} className="chip chip-accent" style={{ fontSize: "0.6rem" }}>
                          <BookOpen size={8} /> {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>{msg.time}</span>
                  {msg.role === "assistant" && (
                    <div className="flex gap-1">
                      <button onClick={() => { navigator.clipboard.writeText(msg.content); toast("Copied!"); }}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: "var(--muted-foreground)" }}>
                        <Copy size={10} />
                      </button>
                      <button onClick={() => toast("Regenerating...")}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: "var(--muted-foreground)" }}>
                        <RotateCcw size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          {toolsOpen && (
            <div className="flex gap-2 mb-2 flex-wrap animate-fade-in-up">
              {TOOLS.map(({ icon: Icon, label }) => (
                <button key={label} onClick={() => { toast(`${label} — coming soon`); setToolsOpen(false); }}
                  className="lg-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs">
                  <Icon size={11} style={{ color: "var(--metal)" }} />
                  <span style={{ color: "var(--foreground)" }}>{label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="lg-panel rounded-2xl p-3 flex items-end gap-2">
            <button onClick={() => toast("Attach file — coming soon")} className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors" style={{ color: "var(--muted-foreground)" }}>
              <Paperclip size={14} />
            </button>
            <textarea
              className="flex-1 bg-transparent text-sm resize-none outline-none min-h-[36px] max-h-[120px]"
              style={{ color: "var(--foreground)", lineHeight: 1.6 }}
              placeholder="Message MyAI..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              rows={1}
            />
            <button onClick={() => toast("Voice input — coming soon")} className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors" style={{ color: "var(--muted-foreground)" }}>
              <Mic size={14} />
            </button>
            <LiquidButton
              onClick={sendMessage}
              disabled={!input.trim()}
              size="xs"
            >
              <Send size={11} />
            </LiquidButton>
          </div>
          <p className="text-center text-xs mt-1.5" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>
            MyAI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
