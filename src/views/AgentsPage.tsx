"use client";

import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Plus, RotateCcw, ChevronRight, Clock, CheckCircle2,
  XCircle, Loader2, Bot, Globe, Code2, Brain, FileText, X
} from "lucide-react";
import { toast } from "sonner";
import LiquidButton from "@/components/LiquidButton";

const JOBS = [
  { id: "1", name: "Market Research Agent", status: "running", progress: 45, started: "14:20", duration: "3m 12s", steps: 7, totalSteps: 15, model: "GPT-4o" },
  { id: "2", name: "Code Review Pipeline", status: "done", progress: 100, started: "13:45", duration: "8m 30s", steps: 12, totalSteps: 12, model: "Claude 3.5" },
  { id: "3", name: "Content Summarizer", status: "done", progress: 100, started: "12:10", duration: "2m 05s", steps: 5, totalSteps: 5, model: "GPT-4o" },
  { id: "4", name: "Data Extraction Job", status: "failed", progress: 30, started: "11:30", duration: "1m 20s", steps: 3, totalSteps: 10, model: "Llama 3.3" },
  { id: "5", name: "Email Drafting Agent", status: "queued", progress: 0, started: "—", duration: "—", steps: 0, totalSteps: 8, model: "GPT-4o" },
];

const TEMPLATES = [
  { id: "research", name: "Research Agent", icon: Globe, desc: "Web search, summarize, and report on any topic", color: "#3B82F6" },
  { id: "code", name: "Code Reviewer", icon: Code2, desc: "Analyze code quality, suggest improvements, write tests", color: "#8B5CF6" },
  { id: "memory", name: "Memory Builder", icon: Brain, desc: "Extract and organize knowledge from conversations", color: "#10B981" },
  { id: "content", name: "Content Writer", icon: FileText, desc: "Draft, edit, and format long-form content", color: "#F59E0B" },
  { id: "custom", name: "Custom Agent", icon: Bot, desc: "Build a fully custom agent with your own steps", color: "#D4A843" },
];

const TIMELINE_STEPS = [
  { label: "Initialize context", status: "done", time: "0.2s" },
  { label: "Web search: market trends", status: "done", time: "2.1s" },
  { label: "Scrape 5 sources", status: "done", time: "4.8s" },
  { label: "Extract key data points", status: "running", time: "..." },
  { label: "Generate analysis report", status: "pending", time: "" },
  { label: "Format output", status: "pending", time: "" },
  { label: "Save to memory", status: "pending", time: "" },
];

export default function AgentsPage() {
  const { theme } = useTheme();
  const [selectedJob, setSelectedJob] = useState<typeof JOBS[0] | null>(JOBS[0]);
  const [showWizard, setShowWizard] = useState(false);
  const isDark = theme === "dark";
  

  const statusIcon = (status: string) => {
    if (status === "running") return <Loader2 size={13} className="animate-spin" style={{ color: "#3b82f6" }} />;
    if (status === "done") return <CheckCircle2 size={13} style={{ color: "#22c55e" }} />;
    if (status === "failed") return <XCircle size={13} style={{ color: "#ef4444" }} />;
    if (status === "queued") return <Clock size={13} className="text-muted-foreground" />;
    return null;
  };

  const chipClass = (status: string) => {
    if (status === "running") return "chip-running";
    if (status === "done") return "chip-done";
    if (status === "failed") return "chip-failed";
    return "chip-local";
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: Jobs Table ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-lg font-bold text-foreground" style={{ fontWeight: 700 }}>Agents & Jobs</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Monitor and manage your AI agent runs</p>
          </div>
          <LiquidButton
            onClick={() => setShowWizard(true)}
            size="sm"
          >
            <Plus size={12} />
            Create agent
          </LiquidButton>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 border-b border-border shrink-0">
          {[
            { label: "Running", value: "1", color: "#3b82f6" },
            { label: "Completed", value: "2", color: "#22c55e" },
            { label: "Failed", value: "1", color: "#ef4444" },
            { label: "Queued", value: "1", color: "var(--metal)" },
          ].map(stat => (
            <div key={stat.label} className="px-3 py-2.5 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <div className="text-xl font-bold" style={{ color: stat.color, fontWeight: 700 }}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0" style={{ background: isDark ? "rgba(14,12,10,0.97)" : "rgba(248,249,251,0.97)" }}>
              <tr className="border-b border-border">
                {["Job Name", "Status", "Progress", "Model", "Started", "Duration", "Steps", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {JOBS.map(job => (
                <tr
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="border-b border-border cursor-pointer transition-all"
                  style={{ background: selectedJob?.id === job.id ? (isDark ? "rgba(212,168,67,0.06)" : "rgba(59,130,246,0.04)") : "transparent" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(job.status)}
                      <span className="text-sm font-medium text-foreground">{job.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${chipClass(job.status)}`}>{job.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${job.progress}%`, background: job.status === "failed" ? "#ef4444" : "var(--metal)" }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{job.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{job.model}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{job.started}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{job.duration}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{job.steps}/{job.totalSteps}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {job.status === "failed" && (
                        <button onClick={e => { e.stopPropagation(); toast("Retrying job..."); }} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-accent transition-all" style={{ color: "var(--metal)" }}>
                          <RotateCcw size={11} />
                        </button>
                      )}
                      {job.status === "running" && (
                        <button onClick={e => { e.stopPropagation(); toast("Job stopped"); }} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-accent transition-all" style={{ color: "#ef4444" }}>
                          <X size={11} />
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); setSelectedJob(job); }} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-accent transition-all" style={{ color: "var(--muted-foreground)" }}>
                        <ChevronRight size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Right: Job Detail ── */}
      {selectedJob && (
        <div className="w-80 flex flex-col border-l border-border shrink-0 glass-panel" style={{ backdropFilter: "blur(20px)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Job Detail</span>
            <button onClick={() => setSelectedJob(null)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-accent transition-all" style={{ color: "var(--muted-foreground)" }}>
              <X size={13} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{selectedJob.name}</h3>
              <div className="flex items-center gap-2">
                <span className={`chip ${chipClass(selectedJob.status)}`}>{selectedJob.status}</span>
                <span className="text-xs text-muted-foreground">{selectedJob.model}</span>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Step Timeline</p>
              <div className="space-y-2">
                {TIMELINE_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{
                      background: step.status === "done" ? "#22c55e20" : step.status === "running" ? (isDark ? "rgba(212,168,67,0.15)" : "rgba(59,130,246,0.1)") : "var(--muted)",
                      border: `1px solid ${step.status === "done" ? "#22c55e40" : step.status === "running" ? "var(--metal-border)" : "var(--border)"}`
                    }}>
                      {step.status === "done" && <CheckCircle2 size={10} style={{ color: "#22c55e" }} />}
                      {step.status === "running" && <Loader2 size={10} className="animate-spin" style={{ color: "var(--metal)" }} />}
                      {step.status === "pending" && <div className="w-1.5 h-1.5 rounded-full bg-border" />}
                    </div>
                    <span className="flex-1 text-xs" style={{ color: step.status === "pending" ? "var(--muted-foreground)" : "var(--foreground)" }}>{step.label}</span>
                    {step.time && <span className="text-xs font-mono text-muted-foreground">{step.time}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Logs */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Logs</p>
              <div className="rounded-xl p-3 font-mono text-xs space-y-1" style={{ background: isDark ? "rgba(8,7,5,0.9)" : "rgba(240,242,245,0.9)", border: "1px solid var(--border)" }}>
                <div style={{ color: "#22c55e" }}>[14:20:01] Agent initialized</div>
                <div style={{ color: "var(--muted-foreground)" }}>[14:20:02] Starting web search...</div>
                <div style={{ color: "var(--muted-foreground)" }}>[14:20:04] Found 12 results</div>
                <div style={{ color: "var(--metal)" }}>[14:20:08] Scraping sources (3/5)...</div>
              </div>
            </div>

            {selectedJob.status === "failed" && (
              <LiquidButton onClick={() => toast("Retrying job...")} size="sm">
                <RotateCcw size={12} />
                Retry Job
              </LiquidButton>
            )}
          </div>
        </div>
      )}

      {/* ── Create Agent Wizard ── */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 animate-blur-in" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} onClick={() => setShowWizard(false)}>
          <div className="glass-panel rounded-2xl w-full max-w-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Create Agent</h2>
              <button onClick={() => setShowWizard(false)} className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-accent transition-all" style={{ color: "var(--muted-foreground)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">Choose a template to get started quickly</p>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => { toast(`Creating ${tmpl.name}...`); setShowWizard(false); }}
                    className="flex items-start gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${tmpl.color}25` }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tmpl.color + "20", border: `1px solid ${tmpl.color}30` }}>
                      <tmpl.icon size={16} style={{ color: tmpl.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-0.5">{tmpl.name}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{tmpl.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
