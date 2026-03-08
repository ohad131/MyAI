"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MessageSquare,
  Send,
  Paperclip,
  Mic,
  Brain,
  ChevronRight,
  Copy,
  Sparkles,
  Loader2,
  Trash2,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import LiquidButton from "@/components/LiquidButton";
import {
  fetchConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  fetchMessages,
} from "@/api/conversations";
import { sendChatMessage } from "@/api/chat";
import { fetchGems } from "@/api/gems";
import { getErrorMessage } from "@/api/client";
import type { Conversation, Message, Gem } from "@/types/api";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return "now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d`;
}

export default function ChatPage() {
  const router = useRouter();
  const {
    activeWorkspace,
    activeWorkspaceId,
    workspacesLoading,
    workspaceBootstrapReady,
    models,
    defaultModel,
  } = useWorkspaceContext();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [convSearch, setConvSearch] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const skipMsgFetchRef = useRef(false);

  const [gems, setGems] = useState<Gem[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelDropOpen, setModelDropOpen] = useState(false);
  const [gemDropOpen, setGemDropOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingConvPatchRef = useRef<
    Record<string, Partial<Pick<Conversation, "model" | "gem_id" | "think_enabled">>>
  >({});

  const activeConv =
    conversations.find((c) => c.id === activeConvId) ?? null;

  // Load conversations when workspace changes — also reset conversation state
  useEffect(() => {
    setActiveConvId(null);
    setMessages([]);
    setConvSearch("");
    setModelDropOpen(false);
    setGemDropOpen(false);

    if (!activeWorkspaceId) {
      setConversations([]);
      return;
    }
    let cancelled = false;
    setConvsLoading(true);
    fetchConversations(activeWorkspaceId)
      .then((data) => {
        if (!cancelled) setConversations(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setConvsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId]);

  // Load gems when workspace changes
  useEffect(() => {
    if (!activeWorkspaceId) {
      setGems([]);
      return;
    }
    fetchGems(activeWorkspaceId).then(setGems).catch(() => {});
  }, [activeWorkspaceId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    if (skipMsgFetchRef.current) {
      skipMsgFetchRef.current = false;
      return;
    }
    let cancelled = false;
    setMsgsLoading(true);
    fetchMessages(activeConvId)
      .then((data) => {
        if (!cancelled) setMessages(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setMsgsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close dropdowns when conversation changes
  useEffect(() => {
    setModelDropOpen(false);
    setGemDropOpen(false);
  }, [activeConvId]);

  // Cleanup abort on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleNewConversation = async () => {
    if (!activeWorkspaceId) return;
    try {
      const conv = await createConversation({
        workspace_id: activeWorkspaceId,
        title: "New conversation",
        model: activeWorkspace?.default_chat_model || defaultModel,
        gem_id: activeWorkspace?.default_gem_id ?? null,
        think_enabled: false,
      });
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv.id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) setActiveConvId(null);
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const getEffectiveConversation = (
    convId: string | null,
  ): Conversation | null => {
    if (!convId) return null;
    const base = conversations.find((c) => c.id === convId);
    if (!base) return null;
    const pending = pendingConvPatchRef.current[convId];
    return pending ? { ...base, ...pending } : base;
  };

  const handleUpdateConvSetting = async <
    K extends keyof Pick<Conversation, "model" | "gem_id" | "think_enabled">,
  >(
    field: K,
    value: Conversation[K],
  ) => {
    if (!activeConvId) return;
    const targetConvId = activeConvId;
    const previous = conversations.find((c) => c.id === targetConvId);
    if (!previous) return;

    // Keep UI/send payload in sync immediately, even before PATCH resolves.
    pendingConvPatchRef.current[targetConvId] = {
      ...(pendingConvPatchRef.current[targetConvId] || {}),
      [field]: value,
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === targetConvId ? { ...c, [field]: value } : c)),
    );

    try {
      const updated = await updateConversation(targetConvId, {
        [field]: value,
      });
      delete pendingConvPatchRef.current[targetConvId];
      setConversations((prev) =>
        prev.map((c) => (c.id === targetConvId ? updated : c)),
      );
    } catch (err) {
      delete pendingConvPatchRef.current[targetConvId];
      setConversations((prev) =>
        prev.map((c) => (c.id === targetConvId ? previous : c)),
      );
      toast.error(getErrorMessage(err));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeWorkspaceId || sending) return;

    let convId = activeConvId;
    const effectiveActiveConv = getEffectiveConversation(activeConvId);
    let convModel = effectiveActiveConv?.model;
    let convGemId = effectiveActiveConv?.gem_id ?? null;
    let convThink = effectiveActiveConv?.think_enabled ?? false;

    if (!convId) {
      try {
        const conv = await createConversation({
          workspace_id: activeWorkspaceId,
          title: input.trim().slice(0, 50),
          model: activeWorkspace?.default_chat_model || defaultModel,
          think_enabled: false,
        });
        setConversations((prev) => [conv, ...prev]);
        skipMsgFetchRef.current = true;
        setActiveConvId(conv.id);
        convId = conv.id;
        convModel = conv.model;
        convGemId = conv.gem_id;
        convThink = conv.think_enabled;
      } catch (err) {
        toast.error(getErrorMessage(err));
        return;
      }
    }

    const userContent = input.trim();
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: convId,
      role: "user",
      content: userContent,
      meta_json: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const assistantMsg = await sendChatMessage(
        {
          workspace_id: activeWorkspaceId,
          conversation_id: convId,
          user_message: userContent,
          selected_model:
            convModel ||
            activeWorkspace?.default_chat_model ||
            defaultModel,
          selected_gem_id: convGemId,
          think: convThink,
        },
        abort.signal,
      );
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.name === "CanceledError" || err.name === "AbortError")
      )
        return;
      const msg = getErrorMessage(err);
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversation_id: convId!,
          role: "system",
          content: msg,
          meta_json: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  };

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(convSearch.toLowerCase()),
  );

  // Keep initial server/client render deterministic until workspace bootstrap runs.
  if (!workspaceBootstrapReady) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={24}
            className="animate-spin"
            style={{ color: "var(--metal)" }}
          />
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Loading workspace...
          </span>
        </div>
      </div>
    );
  }

  // Loading — workspaces still resolving a persisted ID
  if (workspacesLoading && !activeWorkspace && activeWorkspaceId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={24}
            className="animate-spin"
            style={{ color: "var(--metal)" }}
          />
          <span
            className="text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            Loading workspace...
          </span>
        </div>
      </div>
    );
  }

  // No workspace selected
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
          <h3
            className="text-base font-medium"
            style={{ color: "var(--foreground)" }}
          >
            No workspace selected
          </h3>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Select or create a workspace to start chatting.
          </p>
          <LiquidButton onClick={() => router.push("/")} size="sm">
            Go to Workspaces
          </LiquidButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* ── Conversation List ── */}
      {sidebarOpen && (
        <div
          className="w-64 flex flex-col h-full shrink-0 lg-panel-strong animate-fade-in-up"
          style={{
            borderRadius: 0,
            borderLeft: "none",
            borderTop: "none",
            borderBottom: "none",
            borderRight: "1px solid var(--glass-border)",
          }}
        >
          <div
            className="p-3 shrink-0"
            style={{ borderBottom: "1px solid var(--glass-border)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-sm font-semibold flex-1"
                style={{ color: "var(--foreground)" }}
              >
                Conversations
              </span>
              <button
                onClick={handleNewConversation}
                className="lg-btn w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ color: "var(--metal)" }}
              >
                <Plus size={13} />
              </button>
            </div>
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--muted-foreground)" }}
              />
              <input
                className="lg-input w-full pl-7 pr-2 py-1.5 rounded-xl text-xs"
                placeholder="Search..."
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                style={{ paddingLeft: "1.75rem" }}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {convsLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  size={16}
                  className="animate-spin"
                  style={{ color: "var(--metal)" }}
                />
              </div>
            )}
            {!convsLoading && filteredConvs.length === 0 && (
              <div className="text-center py-8">
                <p
                  className="text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {conversations.length === 0
                    ? "No conversations yet"
                    : "No matches"}
                </p>
              </div>
            )}
            {filteredConvs.map((conv) => (
              <div key={conv.id} className="group relative">
                <button
                  onClick={() => setActiveConvId(conv.id)}
                  className="w-full text-left p-2.5 rounded-xl transition-all"
                  style={{
                    background:
                      conv.id === activeConvId
                        ? "var(--metal-dim)"
                        : "transparent",
                    border:
                      conv.id === activeConvId
                        ? "1px solid var(--metal-border)"
                        : "1px solid transparent",
                    boxShadow:
                      conv.id === activeConvId
                        ? "0 0 10px var(--metal-glow)"
                        : "none",
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className="text-xs font-medium truncate pr-6"
                      style={{
                        color:
                          conv.id === activeConvId
                            ? "var(--metal)"
                            : "var(--foreground)",
                      }}
                    >
                      {conv.title}
                    </span>
                    <span
                      className="text-xs shrink-0 ml-1"
                      style={{
                        color: "var(--muted-foreground)",
                        fontSize: "0.6rem",
                      }}
                    >
                      {timeAgo(conv.updated_at)}
                    </span>
                  </div>
                  <p
                    className="text-xs truncate"
                    style={{
                      color: "var(--muted-foreground)",
                      fontSize: "0.7rem",
                    }}
                  >
                    {conv.model}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                  className="absolute right-2 top-2.5 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--muted-foreground)" }}
                  title="Delete conversation"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Chat ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Chat header */}
        <div
          className="lg-panel shrink-0 px-4 py-2.5 flex items-center gap-3"
          style={{
            borderRadius: 0,
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
            borderBottom: "1px solid var(--glass-border)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg-btn w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ChevronRight
              size={13}
              style={{
                transform: sidebarOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </button>
          <div className="flex-1 min-w-0">
            <span
              className="text-sm font-semibold truncate block"
              style={{ color: "var(--foreground)" }}
            >
              {activeConv?.title || "New conversation"}
            </span>
          </div>

          {/* Per-conversation controls */}
          {activeConv && (
            <>
              {/* Model selector */}
              <DropdownMenu
                open={modelDropOpen}
                onOpenChange={(open) => {
                  setModelDropOpen(open);
                  if (open) setGemDropOpen(false);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    className="lg-btn flex items-center gap-1 px-2 py-1 rounded-xl text-xs"
                    style={{ color: "var(--metal)" }}
                  >
                    <span className="truncate max-w-[100px]">
                      {activeConv.model || defaultModel}
                    </span>
                    <ChevronDown size={9} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 lg-panel rounded-xl py-1.5"
                >
                  {models.map((m) => (
                    <DropdownMenuItem
                      key={m.id}
                      onClick={() => {
                        handleUpdateConvSetting("model", m.id);
                        setModelDropOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg mx-1 w-[calc(100%-8px)] cursor-pointer focus:bg-[var(--metal-dim)]"
                      style={{
                        color:
                          m.id === activeConv.model
                            ? "var(--metal)"
                            : "var(--foreground)",
                        background:
                          m.id === activeConv.model
                            ? "var(--metal-dim)"
                            : "transparent",
                      }}
                    >
                      {m.id}{" "}
                      <span style={{ color: "var(--muted-foreground)" }}>
                        ({m.provider})
                      </span>
                    </DropdownMenuItem>
                  ))}
                  {models.length === 0 && (
                    <span
                      className="block px-3 py-1.5 text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Loading models...
                    </span>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Gem selector */}
              {gems.length > 0 && (
                <DropdownMenu
                  open={gemDropOpen}
                  onOpenChange={(open) => {
                    setGemDropOpen(open);
                    if (open) setModelDropOpen(false);
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      className="lg-btn flex items-center gap-1 px-2 py-1 rounded-xl text-xs"
                      style={{
                        color: activeConv.gem_id
                          ? "var(--metal)"
                          : "var(--muted-foreground)",
                      }}
                    >
                      <Sparkles size={10} />
                      <span className="truncate max-w-[80px]">
                        {activeConv.gem_id
                          ? (gems.find((g) => g.id === activeConv.gem_id)
                              ?.name || "Gem")
                          : "No gem"}
                      </span>
                      <ChevronDown size={9} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 lg-panel rounded-xl py-1.5 border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[var(--glass-shadow)]"
                  >
                    <DropdownMenuItem
                      onClick={() => {
                        handleUpdateConvSetting("gem_id", null);
                        setGemDropOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg mx-1 w-[calc(100%-8px)] cursor-pointer focus:bg-[var(--metal-dim)]"
                      style={{
                        color: !activeConv.gem_id
                          ? "var(--metal)"
                          : "var(--foreground)",
                        background: !activeConv.gem_id
                          ? "var(--metal-dim)"
                          : "transparent",
                      }}
                    >
                      None
                    </DropdownMenuItem>
                    {gems.map((g) => (
                      <DropdownMenuItem
                        key={g.id}
                        onClick={() => {
                          handleUpdateConvSetting("gem_id", g.id);
                          setGemDropOpen(false);
                        }}
                        className="px-3 py-1.5 text-xs rounded-lg mx-1 w-[calc(100%-8px)] cursor-pointer focus:bg-[var(--metal-dim)]"
                        style={{
                          color:
                            g.id === activeConv.gem_id
                              ? "var(--metal)"
                              : "var(--foreground)",
                          background:
                            g.id === activeConv.gem_id
                              ? "var(--metal-dim)"
                              : "transparent",
                        }}
                      >
                        {g.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Think toggle */}
              <button
                onClick={() =>
                  handleUpdateConvSetting(
                    "think_enabled",
                    !activeConv.think_enabled,
                  )
                }
                className="lg-btn flex items-center gap-1 px-2 py-1 rounded-xl text-xs"
                style={{
                  color: activeConv.think_enabled
                    ? "var(--metal)"
                    : "var(--muted-foreground)",
                  background: activeConv.think_enabled
                    ? "var(--metal-dim)"
                    : "transparent",
                  border: activeConv.think_enabled
                    ? "1px solid var(--metal-border)"
                    : "1px solid transparent",
                }}
                title={
                  activeConv.think_enabled
                    ? "Thinking enabled"
                    : "Thinking disabled"
                }
              >
                <Brain size={11} /> Think
              </button>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {msgsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2
                size={20}
                className="animate-spin"
                style={{ color: "var(--metal)" }}
              />
            </div>
          )}

          {!msgsLoading && !activeConvId && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "var(--metal-dim)",
                  border: "1px solid var(--metal-border)",
                }}
              >
                <MessageSquare size={24} style={{ color: "var(--metal)" }} />
              </div>
              <h3
                className="text-base font-medium mb-2"
                style={{ color: "var(--foreground)" }}
              >
                Start a conversation
              </h3>
              <p
                className="text-sm max-w-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                Type a message below or create a new conversation from the
                sidebar.
              </p>
            </div>
          )}

          {!msgsLoading && activeConvId && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p
                className="text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                No messages yet. Send a message to begin.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mr-3 mt-0.5"
                  style={{
                    background: "var(--metal-dim)",
                    border: "1px solid var(--metal-border)",
                    boxShadow: "0 0 8px var(--metal-glow)",
                  }}
                >
                  <Sparkles size={12} style={{ color: "var(--metal)" }} />
                </div>
              )}
              <div
                className={`max-w-[72%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}
              >
                <div
                  className="lg-panel rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background:
                      msg.role === "user"
                        ? "var(--metal-dim)"
                        : msg.role === "system"
                          ? "rgba(239,68,68,0.06)"
                          : "var(--glass-bg)",
                    borderColor:
                      msg.role === "user"
                        ? "var(--metal-border)"
                        : msg.role === "system"
                          ? "rgba(239,68,68,0.2)"
                          : undefined,
                    boxShadow:
                      msg.role === "user"
                        ? "0 4px 20px var(--metal-glow), inset 0 1px 0 rgba(255,255,255,0.15)"
                        : undefined,
                    color:
                      msg.role === "system"
                        ? "#ef4444"
                        : "var(--foreground)",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span
                    className="text-xs"
                    style={{
                      color: "var(--muted-foreground)",
                      fontSize: "0.65rem",
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.role === "assistant" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          toast("Copied!");
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <Copy size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Sending indicator */}
          {sending && (
            <div className="flex justify-start animate-fade-in-up">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mr-3 mt-0.5"
                style={{
                  background: "var(--metal-dim)",
                  border: "1px solid var(--metal-border)",
                }}
              >
                <Loader2
                  size={12}
                  className="animate-spin"
                  style={{ color: "var(--metal)" }}
                />
              </div>
              <div
                className="lg-panel rounded-2xl px-4 py-3 text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="lg-panel rounded-2xl p-3 flex items-end gap-2">
            <button
              onClick={() => toast("Attach file — coming soon")}
              className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Paperclip size={14} />
            </button>
            <textarea
              className="flex-1 bg-transparent text-sm resize-none outline-none min-h-[36px] max-h-[120px]"
              style={{ color: "var(--foreground)", lineHeight: 1.6 }}
              placeholder="Message MyAI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              disabled={sending}
            />
            <button
              onClick={() => toast("Voice input — coming soon")}
              className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Mic size={14} />
            </button>
            <LiquidButton
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              size="xs"
            >
              {sending ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Send size={11} />
              )}
            </LiquidButton>
          </div>
          <p
            className="text-center text-xs mt-1.5"
            style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}
          >
            MyAI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
