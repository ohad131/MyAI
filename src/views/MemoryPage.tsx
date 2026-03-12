"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import {
  approveMemorySuggestion,
  createMemory,
  deleteMemory,
  fetchMemories,
  fetchMemorySuggestions,
  rejectMemorySuggestion,
  updateMemory,
} from "@/api/memories";
import { getErrorMessage } from "@/api/client";
import type { Memory, MemorySuggestion } from "@/types/api";
import { toast } from "sonner";
import LiquidButton from "@/components/LiquidButton";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Filter,
  LayoutGrid,
  Loader2,
  Pin,
  Plus,
  Search,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

function mergeById<T extends { id: string }>(...lists: T[][]): T[] {
  const byId = new Map<string, T>();
  for (const list of lists) {
    for (const item of list) byId.set(item.id, item);
  }
  return [...byId.values()];
}

function sortByDateDesc<T>(items: T[], dateSelector: (item: T) => string): T[] {
  return [...items].sort(
    (a, b) => new Date(dateSelector(b)).getTime() - new Date(dateSelector(a)).getTime(),
  );
}

export default function MemoryPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { activeWorkspace, activeWorkspaceId, workspacesLoading, workspaceBootstrapReady } =
    useWorkspaceContext();

  const [activeTab, setActiveTab] = useState<"auto" | "pinned">("auto");
  const [search, setSearch] = useState("");
  const [enabledOnly, setEnabledOnly] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [suggestions, setSuggestions] = useState<MemorySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const isDark = theme === "dark";

  const loadMemoryData = async () => {
    if (!activeWorkspaceId) {
      setMemories([]);
      setSuggestions([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [
        workspaceMemories,
        globalMemories,
        workspaceSuggestions,
        globalSuggestions,
      ] = await Promise.all([
        fetchMemories({ scope: "workspace", scope_id: activeWorkspaceId }),
        fetchMemories({ scope: "global" }),
        fetchMemorySuggestions({
          status: "pending",
          scope: "workspace",
          scope_id: activeWorkspaceId,
        }),
        fetchMemorySuggestions({ status: "pending", scope: "global" }),
      ]);

      setMemories(
        sortByDateDesc(mergeById(workspaceMemories, globalMemories), (m) => m.updated_at),
      );
      setSuggestions(
        sortByDateDesc(mergeById(workspaceSuggestions, globalSuggestions), (s) => s.created_at),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  const runMemoryMutation = async (key: string, fn: () => Promise<void>) => {
    setBusyIds((prev) => ({ ...prev, [key]: true }));
    try {
      await fn();
      await loadMemoryData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyIds((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const filteredMemories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return memories.filter((memory) => {
      if (activeTab === "pinned" && !memory.pinned) return false;
      if (activeTab === "auto" && memory.pinned) return false;
      if (enabledOnly && !memory.enabled) return false;
      if (!query) return true;

      const inContent = memory.content.toLowerCase().includes(query);
      const inSource = (memory.source ?? "").toLowerCase().includes(query);
      const inTags = (memory.tags_json ?? []).some((t) => t.toLowerCase().includes(query));
      return inContent || inSource || inTags;
    });
  }, [activeTab, enabledOnly, memories, search]);

  const pinnedCount = memories.filter((m) => m.pinned).length;
  const autoCount = memories.length - pinnedCount;

  const confidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return "#22c55e";
    if (confidence >= 0.85) return "var(--metal)";
    return "#f59e0b";
  };

  const addMemory = async () => {
    if (!activeWorkspaceId) return;
    const content = window.prompt("New memory content");
    if (!content || !content.trim()) return;

    await runMemoryMutation("create-memory", async () => {
      await createMemory({
        scope: "workspace",
        scope_id: activeWorkspaceId,
        type: "fact",
        content: content.trim(),
      });
      toast.success("Memory created");
    });
  };

  const editMemory = async (memory: Memory) => {
    const content = window.prompt("Edit memory content", memory.content);
    if (content === null || content.trim() === memory.content) return;
    if (!content.trim()) {
      toast.error("Memory content cannot be empty");
      return;
    }

    await runMemoryMutation(`edit-${memory.id}`, async () => {
      await updateMemory(memory.id, { content: content.trim() });
      toast.success("Memory updated");
    });
  };

  const togglePin = async (memory: Memory) => {
    await runMemoryMutation(`pin-${memory.id}`, async () => {
      await updateMemory(memory.id, { pinned: !memory.pinned });
    });
  };

  const toggleEnabled = async (memory: Memory) => {
    await runMemoryMutation(`enabled-${memory.id}`, async () => {
      await updateMemory(memory.id, { enabled: !memory.enabled });
    });
  };

  const removeMemory = async (memory: Memory) => {
    const confirmed = window.confirm("Delete this memory?");
    if (!confirmed) return;

    await runMemoryMutation(`delete-${memory.id}`, async () => {
      await deleteMemory(memory.id);
      toast.success("Memory deleted");
    });
  };

  const approveSuggestion = async (suggestion: MemorySuggestion) => {
    const edited = window.prompt(
      "Approve suggestion content (edit before approve if needed)",
      suggestion.proposed_content,
    );
    if (edited === null) return;
    if (!edited.trim()) {
      toast.error("Approved memory content cannot be empty");
      return;
    }

    await runMemoryMutation(`approve-${suggestion.id}`, async () => {
      await approveMemorySuggestion(suggestion.id, edited.trim());
      toast.success("Suggestion approved");
    });
  };

  const rejectSuggestion = async (suggestion: MemorySuggestion) => {
    await runMemoryMutation(`reject-${suggestion.id}`, async () => {
      await rejectMemorySuggestion(suggestion.id);
      toast.success("Suggestion rejected");
    });
  };

  if (!workspaceBootstrapReady) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--metal)" }} />
      </div>
    );
  }

  if (workspacesLoading && !activeWorkspace && activeWorkspaceId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--metal)" }} />
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Loading workspace...
          </span>
        </div>
      </div>
    );
  }

  if (!activeWorkspaceId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "var(--metal-dim)",
              border: "1px solid var(--metal-border)",
            }}
          >
            <LayoutGrid size={24} style={{ color: "var(--metal)" }} />
          </div>
          <h3 className="text-base font-medium" style={{ color: "var(--foreground)" }}>
            No workspace selected
          </h3>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Select a workspace before managing memories.
          </p>
          <LiquidButton onClick={() => router.push("/")} size="sm">
            Go to Workspaces
          </LiquidButton>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1" style={{ fontWeight: 700 }}>
              Memory Manager
            </h1>
            <p className="text-sm text-muted-foreground">
              Workspace and global memories, plus pending suggestions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
            >
              <AlertTriangle size={13} style={{ color: "var(--metal)" }} />
              <span className="text-sm font-semibold text-foreground">{memories.length}</span>
              <span className="text-xs text-muted-foreground">memories</span>
            </div>
            <button
              onClick={addMemory}
              disabled={!!busyIds["create-memory"]}
              className="btn-accent flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold shimmer-hover disabled:opacity-60"
              style={{ background: "var(--metal)" }}
            >
              {busyIds["create-memory"] ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Add
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {(["auto", "pinned"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 text-sm font-medium transition-all capitalize"
                style={{
                  background:
                    activeTab === tab
                      ? isDark
                        ? "rgba(212,168,67,0.12)"
                        : "rgba(59,130,246,0.1)"
                      : "transparent",
                  color: activeTab === tab ? "var(--metal)" : "var(--muted-foreground)",
                }}
              >
                {tab === "auto" ? "Auto-captured" : "Pinned"}
                <span
                  className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                >
                  {tab === "auto" ? autoCount : pinnedCount}
                </span>
              </button>
            ))}
          </div>

          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
          >
            <Search size={13} className="text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <button
            onClick={() => setEnabledOnly((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all hover:bg-accent"
            style={{
              border: "1px solid var(--border)",
              color: enabledOnly ? "var(--metal)" : "var(--muted-foreground)",
            }}
          >
            <Filter size={13} />
            {enabledOnly ? "Enabled only" : "All"}
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--metal)" }} />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm" style={{ color: "var(--destructive, #ef4444)" }}>
              {error}
            </p>
            <LiquidButton onClick={loadMemoryData} size="sm">
              Retry
            </LiquidButton>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="space-y-2 mb-8">
              {filteredMemories.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No memories found
                </div>
              )}
              {filteredMemories.map((memory) => {
                const busy =
                  busyIds[`pin-${memory.id}`] ||
                  busyIds[`enabled-${memory.id}`] ||
                  busyIds[`edit-${memory.id}`] ||
                  busyIds[`delete-${memory.id}`];

                return (
                  <div
                    key={memory.id}
                    className="group flex items-start gap-4 px-4 py-3.5 rounded-2xl transition-all"
                    style={{
                      background: isDark ? "rgba(20,18,14,0.8)" : "rgba(255,255,255,0.8)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid var(--border)",
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                      <div className="w-1 h-10 rounded-full" style={{ background: "var(--border)" }}>
                        <div
                          className="w-full rounded-full transition-all"
                          style={{
                            height: `${Math.max(0, Math.min(1, memory.confidence ?? 1)) * 100}%`,
                            background: confidenceColor(memory.confidence ?? 1),
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-relaxed mb-2">{memory.content}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Tag size={10} />
                          {memory.source || memory.scope}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={10} />
                          {dateFormatter.format(new Date(memory.updated_at))}
                        </span>
                        <span
                          className="text-xs font-mono"
                          style={{ color: confidenceColor(memory.confidence ?? 1) }}
                        >
                          {Math.round((memory.confidence ?? 1) * 100)}% confidence
                        </span>
                        {!memory.enabled && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              color: "#ef4444",
                              border: "1px solid rgba(239,68,68,0.2)",
                            }}
                          >
                            disabled
                          </span>
                        )}
                        {(memory.tags_json ?? []).map((tag) => (
                          <span
                            key={`${memory.id}-${tag}`}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "var(--metal-dim)",
                              color: "var(--metal)",
                              border: "1px solid var(--metal-border)",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <button
                        onClick={() => toggleEnabled(memory)}
                        disabled={!!busy}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-all disabled:opacity-60"
                        style={{ color: memory.enabled ? "#22c55e" : "var(--muted-foreground)" }}
                        title={memory.enabled ? "Disable" : "Enable"}
                      >
                        <CheckCircle2 size={13} />
                      </button>
                      <button
                        onClick={() => togglePin(memory)}
                        disabled={!!busy}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-all disabled:opacity-60"
                        style={{
                          color: memory.pinned ? "var(--metal)" : "var(--muted-foreground)",
                        }}
                        title="Pin"
                      >
                        <Pin size={13} />
                      </button>
                      <button
                        onClick={() => editMemory(memory)}
                        disabled={!!busy}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-all disabled:opacity-60"
                        style={{ color: "var(--muted-foreground)" }}
                        title="Edit"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => removeMemory(memory)}
                        disabled={!!busy}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-all disabled:opacity-60"
                        style={{ color: "#ef4444" }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Pending suggestions</h2>
                <span className="text-xs text-muted-foreground">{suggestions.length}</span>
              </div>

              {suggestions.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">No pending suggestions</div>
              ) : (
                <div className="space-y-2">
                  {suggestions.map((suggestion) => {
                    const busy =
                      busyIds[`approve-${suggestion.id}`] || busyIds[`reject-${suggestion.id}`];
                    return (
                      <div
                        key={suggestion.id}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{
                          border: "1px solid var(--border)",
                          background: "var(--muted)",
                          opacity: busy ? 0.7 : 1,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-relaxed mb-1.5">
                            {suggestion.proposed_content}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                            <span>{suggestion.scope}</span>
                            {typeof suggestion.confidence === "number" && (
                              <span>{Math.round(suggestion.confidence * 100)}% confidence</span>
                            )}
                            {suggestion.reason && <span>{suggestion.reason}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => approveSuggestion(suggestion)}
                            disabled={busy}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-all disabled:opacity-60"
                            style={{ color: "#22c55e" }}
                            title="Approve"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                          <button
                            onClick={() => rejectSuggestion(suggestion)}
                            disabled={busy}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent transition-all disabled:opacity-60"
                            style={{ color: "#ef4444" }}
                            title="Reject"
                          >
                            <XCircle size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
