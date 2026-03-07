"use client";

import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Folder, FolderOpen, File, ChevronRight, ChevronDown,
  Play, RotateCcw, Copy, Wand2, TestTube, GitCompare,
  Terminal, MessageSquare, X, Maximize2, Plus, Search, Send
} from "lucide-react";
import { toast } from "sonner";
import LiquidButton from "@/components/LiquidButton";

const FILE_TREE = [
  { id: "src", name: "src", type: "folder", open: true, children: [
    { id: "components", name: "components", type: "folder", open: false, children: [
      { id: "AppShell", name: "AppShell.tsx", type: "file", lang: "tsx" },
      { id: "CommandPalette", name: "CommandPalette.tsx", type: "file", lang: "tsx" },
    ]},
    { id: "pages", name: "pages", type: "folder", open: true, children: [
      { id: "ChatPage", name: "ChatPage.tsx", type: "file", lang: "tsx", active: true },
      { id: "CodePage", name: "CodePage.tsx", type: "file", lang: "tsx" },
      { id: "WorkspacePage", name: "WorkspacePage.tsx", type: "file", lang: "tsx" },
    ]},
    { id: "index.css", name: "index.css", type: "file", lang: "css" },
    { id: "App.tsx", name: "App.tsx", type: "file", lang: "tsx" },
  ]},
  { id: "package.json", name: "package.json", type: "file", lang: "json" },
];

const CODE_SAMPLE = `import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Send, Brain, Paperclip } from "lucide-react";

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const [thinkMode, setThinkMode] = useState(false);
  const isDark = theme === "dark";
  

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Message MyAI..."
        rows={3}
        className="w-full bg-transparent px-4 pt-3 text-sm outline-none resize-none"
      />
      <div className="flex items-center gap-2 px-3 pb-3">
        <button className="hover:bg-accent rounded-lg p-1.5">
          <Paperclip size={14} />
        </button>
        <button
          onClick={() => setThinkMode(!thinkMode)}
          className={\`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs \${
            thinkMode ? "text-accent" : "text-muted-foreground"
          }\`}
        >
          <Brain size={11} />
          Think mode
        </button>
        <div className="flex-1" />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="btn-accent px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: "var(--metal)" }}
        >
          <Send size={12} />
          Send
        </button>
      </div>
    </div>
  );
}`;

const AI_MESSAGES = [
  { role: "assistant", content: "I can see you're working on the ChatComposer component. Would you like me to refactor it, add tests, or explain any part of the code?" },
  { role: "user", content: "Can you add error handling for the send function?" },
  { role: "assistant", content: "I'll add try/catch error handling to the handleSend function and a visual error state to the composer." },
];

const LOG_LINES = [
  { type: "info",    text: "▶ next dev server started on http://localhost:3000" },
  { type: "success", text: "✓ TypeScript compilation successful" },
  { type: "warn",    text: "⚠ Unused import 'X' in CommandPalette.tsx:3" },
  { type: "info",    text: "HMR update: ChatPage.tsx" },
];

export default function CodePage() {
  const { theme } = useTheme();
  const [selectedFile, setSelectedFile] = useState("ChatPage");
  const [aiInput, setAiInput] = useState("");
  const [logsOpen, setLogsOpen] = useState(true);
  const isDark = theme === "dark";
  

  const logColor = (type: string) => {
    if (type === "success") return "#22c55e";
    if (type === "warn") return "#f59e0b";
    if (type === "error") return "#ef4444";
    return "var(--muted-foreground)";
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── File Tree ── */}
      <div
        className="w-52 flex flex-col border-r border-border shrink-0"
        style={{ background: isDark ? "rgba(12,10,8,0.97)" : "rgba(242,244,247,0.97)" }}
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-border">
          <span className="text-xs font-semibold text-foreground">Explorer</span>
          <div className="flex items-center gap-1">
            <button onClick={() => toast("New file")} className="w-5 h-5 flex items-center justify-center rounded hover:bg-accent transition-all" style={{ color: "var(--muted-foreground)" }}>
              <Plus size={12} />
            </button>
            <button onClick={() => toast("Search files")} className="w-5 h-5 flex items-center justify-center rounded hover:bg-accent transition-all" style={{ color: "var(--muted-foreground)" }}>
              <Search size={12} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <FileTreeNode nodes={FILE_TREE} selectedFile={selectedFile} onSelect={setSelectedFile} depth={0} />
        </div>
      </div>

      {/* ── Code Editor ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab bar */}
        <div className="flex items-center border-b border-border px-2 py-1 gap-1 shrink-0" style={{ background: isDark ? "rgba(14,12,10,0.97)" : "rgba(248,249,251,0.97)" }}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: isDark ? "rgba(212,168,67,0.1)" : "rgba(59,130,246,0.08)", border: "1px solid var(--metal-border)", color: "var(--metal)" }}>
            <File size={11} />
            ChatPage.tsx
            <button onClick={() => {}} className="ml-1 hover:text-foreground"><X size={10} /></button>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer">
            <File size={11} />
            App.tsx
          </div>
        </div>

        {/* AI Actions bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0" style={{ background: isDark ? "rgba(16,14,11,0.9)" : "rgba(250,251,253,0.9)" }}>
          {[
            { icon: Wand2, label: "Explain", shortcut: "⌘E" },
            { icon: RotateCcw, label: "Refactor", shortcut: "⌘R" },
            { icon: TestTube, label: "Gen Tests", shortcut: "⌘T" },
            { icon: GitCompare, label: "Diff", shortcut: "⌘D" },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => toast(`${action.label} — running AI analysis...`)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all hover:bg-accent shimmer-hover"
              style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
            >
              <action.icon size={12} style={{ color: "var(--metal)" }} />
              {action.label}
              <kbd className="text-xs opacity-50">{action.shortcut}</kbd>
            </button>
          ))}
          <div className="flex-1" />
          <LiquidButton onClick={() => toast("Running...")} size="sm">
            <Play size={11} />
            Run
          </LiquidButton>
        </div>

        {/* Code area */}
        <div className="flex-1 overflow-auto code-block rounded-none border-0 border-b border-border">
          <pre className="p-4 text-xs leading-relaxed">
            <code style={{ color: isDark ? "#e2d9c5" : "#1e293b" }}>
              {CODE_SAMPLE.split("\n").map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-8 shrink-0 text-right pr-4 select-none" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>{i + 1}</span>
                  <span>{line || " "}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>

        {/* Logs panel */}
        {logsOpen && (
          <div className="h-28 border-t border-border shrink-0 overflow-y-auto" style={{ background: isDark ? "rgba(8,7,5,0.98)" : "rgba(240,242,245,0.98)" }}>
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border">
              <Terminal size={12} style={{ color: "var(--metal)" }} />
              <span className="text-xs font-semibold text-foreground">Output</span>
              <div className="flex-1" />
              <button onClick={() => setLogsOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
            </div>
            <div className="px-3 py-2 space-y-1 font-mono text-xs">
              {LOG_LINES.map((log, i) => (
                <div key={i} style={{ color: logColor(log.type) }}>{log.text}</div>
              ))}
            </div>
          </div>
        )}
        {!logsOpen && (
          <button onClick={() => setLogsOpen(true)} className="flex items-center gap-2 px-3 py-1.5 border-t border-border text-xs text-muted-foreground hover:text-foreground transition-all shrink-0">
            <Terminal size={12} style={{ color: "var(--metal)" }} />
            Output
          </button>
        )}
      </div>

      {/* ── AI Chat Panel (Glass) ── */}
      <div
        className="w-72 flex flex-col border-l border-border shrink-0 glass-panel"
        style={{ backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
          <MessageSquare size={13} style={{ color: "var(--metal)" }} />
          <span className="text-xs font-semibold text-foreground">AI Assistant</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {AI_MESSAGES.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[85%] px-3 py-2 rounded-xl text-xs"
                style={{
                  background: msg.role === "user"
                    ? (isDark ? "rgba(212,168,67,0.15)" : "rgba(59,130,246,0.1)")
                    : "var(--muted)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)"
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 pb-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { toast("AI response..."); setAiInput(""); } }}
              placeholder="Ask about this code..."
              className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
            />
            <LiquidButton onClick={() => { toast("Sending..."); setAiInput(""); }} size="xs">
              <Send size={11} />
            </LiquidButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileTreeNode({ nodes, selectedFile, onSelect, depth }: any) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ src: true, pages: true });

  const toggle = (id: string) => setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      {nodes.map((node: any) => (
        <div key={node.id}>
          <button
            onClick={() => node.type === "folder" ? toggle(node.id) : onSelect(node.id)}
            className="flex items-center gap-1.5 w-full px-2 py-1 text-xs transition-all hover:bg-accent"
            style={{
              paddingLeft: `${depth * 12 + 8}px`,
              color: node.id === selectedFile ? "var(--metal)" : "var(--foreground)",
              background: node.id === selectedFile ? "var(--metal-dim)" : "transparent"
            }}
          >
            {node.type === "folder" ? (
              <>
                {openFolders[node.id] ? <ChevronDown size={11} className="text-muted-foreground" /> : <ChevronRight size={11} className="text-muted-foreground" />}
                {openFolders[node.id] ? <FolderOpen size={12} style={{ color: "var(--metal)" }} /> : <Folder size={12} style={{ color: "var(--metal)" }} />}
              </>
            ) : (
              <>
                <span className="w-3" />
                <File size={11} className="text-muted-foreground" />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {node.type === "folder" && openFolders[node.id] && node.children && (
            <FileTreeNode nodes={node.children} selectedFile={selectedFile} onSelect={onSelect} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}
