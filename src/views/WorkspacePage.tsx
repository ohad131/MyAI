"use client";

import { useState, useRef, useCallback } from "react";
import type { Route } from "next";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MessageSquare,
  Code2,
  Image,
  Bot,
  MoreHorizontal,
  Clock,
  Zap,
  Globe,
  Sparkles,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import LiquidButton from "@/components/LiquidButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "@/api/workspaces";
import { getErrorMessage } from "@/api/client";
import type { Workspace, WorkspaceCreatePayload } from "@/types/api";

const QUICK_ACTIONS = [
  { icon: MessageSquare, label: "New Chat", path: "/chat" },
  { icon: Code2, label: "Code Review", path: "/code" },
  { icon: Image, label: "Generate Image", path: "/images" },
  { icon: Bot, label: "Run Agent", path: "/agents" },
] as const satisfies ReadonlyArray<{
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  label: string;
  path: Route;
}>;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default function WorkspacePage() {
  const router = useRouter();
  const {
    workspaces,
    workspacesLoading,
    workspacesError,
    activeWorkspaceId,
    setActiveWorkspaceId,
    refreshWorkspaces,
    models,
    defaultModel,
  } = useWorkspaceContext();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formModel, setFormModel] = useState(defaultModel);
  const [formLang, setFormLang] = useState("en");

  const openCreateDialog = () => {
    setEditingWorkspace(null);
    setFormName("");
    setFormDesc("");
    setFormModel(defaultModel);
    setFormLang("en");
    setDialogOpen(true);
  };

  const openEditDialog = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setFormName(ws.name);
    setFormDesc(ws.description || "");
    setFormModel(ws.default_chat_model || defaultModel);
    setFormLang(ws.default_language || "en");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload: WorkspaceCreatePayload = {
        name: formName.trim(),
        description: formDesc.trim(),
        default_chat_model: formModel,
        default_language: formLang,
      };
      if (editingWorkspace) {
        await updateWorkspace(editingWorkspace.id, payload);
        toast.success("Workspace updated");
      } else {
        const created = await createWorkspace(payload);
        setActiveWorkspaceId(created.id);
        toast.success("Workspace created");
      }
      setDialogOpen(false);
      await refreshWorkspaces();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWorkspace(deleteTarget.id);
      if (activeWorkspaceId === deleteTarget.id) setActiveWorkspaceId(null);
      toast.success("Workspace deleted");
      setDeleteTarget(null);
      await refreshWorkspaces();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSelect = (ws: Workspace) => {
    setActiveWorkspaceId(ws.id);
    router.push("/chat");
  };

  const filtered = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description || "").toLowerCase().includes(search.toLowerCase()),
  );

  if (workspacesLoading) {
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
            Loading workspaces...
          </span>
        </div>
      </div>
    );
  }

  if (workspacesError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <span
            className="text-sm"
            style={{ color: "var(--destructive, #ef4444)" }}
          >
            {workspacesError}
          </span>
          <LiquidButton onClick={refreshWorkspaces} size="sm">
            Retry
          </LiquidButton>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto lg-scroll"
      style={{ scrollbarGutter: "stable" }}
    >
      <div className="max-w-4xl mx-auto px-8 pt-8 pb-12">
        {/* Header */}
        <div
          className="flex items-start justify-between mb-7"
          style={{ overflow: "visible" }}
        >
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight mb-1"
              style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
            >
              Workspaces
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Manage your AI contexts and conversations
            </p>
          </div>
          <LiquidButton onClick={openCreateDialog} size="sm">
            <Plus size={12} />
            New workspace
          </LiquidButton>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={13}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            className="lg-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            placeholder="Search workspaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {QUICK_ACTIONS.map(({ icon: Icon, label, path }) => (
            <button
              key={label}
              onClick={() => router.push(path)}
              className="lg-btn flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
            >
              <Icon
                size={14}
                style={{ color: "var(--metal)", opacity: 0.85 }}
              />
              <span style={{ color: "var(--foreground)", fontWeight: 450 }}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {workspaces.length === 0 && (
          <div className="text-center py-16">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "var(--metal-dim)",
                border: "1px solid var(--metal-border)",
              }}
            >
              <Sparkles size={24} style={{ color: "var(--metal)" }} />
            </div>
            <h3
              className="text-base font-medium mb-2"
              style={{ color: "var(--foreground)" }}
            >
              No workspaces yet
            </h3>
            <p
              className="text-sm mb-5"
              style={{ color: "var(--muted-foreground)" }}
            >
              Create your first workspace to get started
            </p>
            <LiquidButton onClick={openCreateDialog} size="sm">
              <Plus size={12} /> Create workspace
            </LiquidButton>
          </div>
        )}

        {/* Workspaces grid */}
        {filtered.length > 0 && (
          <section className="mb-8">
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((ws, i) => (
                <WorkspaceCard
                  key={ws.id}
                  ws={ws}
                  index={i}
                  isActive={ws.id === activeWorkspaceId}
                  onClick={() => handleSelect(ws)}
                  onEdit={() => openEditDialog(ws)}
                  onDelete={() => setDeleteTarget(ws)}
                />
              ))}
            </div>
          </section>
        )}

        {/* No search results */}
        {workspaces.length > 0 && filtered.length === 0 && search && (
          <p
            className="text-center py-12 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            No workspaces matching &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "var(--foreground)" }}>
              {editingWorkspace ? "Edit workspace" : "New workspace"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: "var(--muted-foreground)" }}
              >
                Name
              </label>
              <input
                className="lg-input w-full px-3 py-2 rounded-xl text-sm"
                placeholder="Workspace name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>
            <div>
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: "var(--muted-foreground)" }}
              >
                Description
              </label>
              <textarea
                className="lg-input w-full px-3 py-2 rounded-xl text-sm resize-none"
                placeholder="Optional description"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: "var(--muted-foreground)" }}
              >
                Default model
              </label>
              <select
                className="lg-input w-full px-3 py-2 rounded-xl text-sm"
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                style={{
                  color: "var(--foreground)",
                  background: "var(--glass-bg)",
                }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
                {models.length === 0 && (
                  <option value={defaultModel}>{defaultModel}</option>
                )}
              </select>
            </div>
            <div>
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: "var(--muted-foreground)" }}
              >
                Language
              </label>
              <div className="flex gap-2">
                {(["en", "he"] as const).map((l) => (
                  <button
                    key={l}
                    className="lg-btn px-4 py-1.5 rounded-xl text-xs font-medium"
                    onClick={() => setFormLang(l)}
                    style={{
                      background:
                        formLang === l ? "var(--metal-dim)" : "transparent",
                      color:
                        formLang === l
                          ? "var(--metal)"
                          : "var(--muted-foreground)",
                      border:
                        formLang === l
                          ? "1px solid var(--metal-border)"
                          : "1px solid transparent",
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              className="lg-btn px-4 py-2 rounded-xl text-sm"
              onClick={() => setDialogOpen(false)}
              style={{ color: "var(--muted-foreground)" }}
            >
              Cancel
            </button>
            <LiquidButton
              onClick={handleSave}
              disabled={saving || !formName.trim()}
              size="sm"
            >
              {saving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : null}
              {editingWorkspace ? "Save" : "Create"}
            </LiquidButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "var(--foreground)" }}>
              Delete workspace
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}
              &rdquo;? This will remove all conversations in this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="lg-btn px-4 py-2 rounded-xl text-sm"
              style={{
                color: "var(--muted-foreground)",
                background: "transparent",
                border: "1px solid var(--glass-border)",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WorkspaceCard({
  ws,
  onClick,
  onEdit,
  onDelete,
  index = 0,
  isActive,
}: {
  ws: Workspace;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index?: number;
  isActive?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [shimActive, setShimActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const shimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    setShimActive(false);
    if (shimTimerRef.current) clearTimeout(shimTimerRef.current);
    shimTimerRef.current = setTimeout(() => setShimActive(true), 10);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    if (shimTimerRef.current) clearTimeout(shimTimerRef.current);
    shimTimerRef.current = setTimeout(() => setShimActive(false), 950);
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      className="lg-panel rounded-xl p-4 text-left cursor-pointer ws-card-enter"
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition:
          "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease, box-shadow 0.2s ease",
        animationDelay: `${index * 60}ms`,
        boxShadow: hovered
          ? `var(--glass-shadow-hover), 0 0 0 1px var(--metal-border)`
          : isActive
            ? `var(--glass-shadow), 0 0 0 1.5px var(--metal-border)`
            : `var(--glass-shadow)`,
      }}
    >
      {/* Shimmer sweep */}
      <div className={`ws-card-shimmer${shimActive ? " active" : ""}`} />

      {/* Subtle top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, var(--metal-border) 30%, var(--metal-border) 70%, transparent 100%)",
          opacity: isActive ? 1 : 0.4,
        }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
          style={{
            background: isActive ? "var(--metal-dim)" : "var(--glass-bg)",
            border: `1px solid ${isActive ? "var(--metal-border)" : "var(--glass-border)"}`,
            color: isActive ? "var(--metal)" : "var(--muted-foreground)",
          }}
        >
          {ws.name[0]?.toUpperCase()}
        </div>
        <div className="flex items-center gap-1.5">
          {isActive && (
            <span
              className="chip chip-accent"
              style={{ fontSize: "0.55rem", padding: "0.05rem 0.35rem" }}
            >
              active
            </span>
          )}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--glass-bg)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <MoreHorizontal size={12} />
            </button>
            {menuOpen && (
              <>
              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
              <div
                className="absolute right-0 top-full mt-1 w-32 lg-panel rounded-xl py-1 z-50"
                style={{ animation: "fade-up 0.15s ease" }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors rounded-lg"
                  style={{
                    color: "var(--foreground)",
                    margin: "0 4px",
                    width: "calc(100% - 8px)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--glass-bg)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Pencil size={10} /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors rounded-lg"
                  style={{
                    color: "#ef4444",
                    margin: "0 4px",
                    width: "calc(100% - 8px)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(239,68,68,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
              </>
            )}
          </div>
        </div>
      </div>

      <h3
        className="text-sm font-medium mb-1"
        style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
      >
        {ws.name}
      </h3>
      <p
        className="text-xs mb-3 line-clamp-2"
        style={{ color: "var(--muted-foreground)", lineHeight: 1.55 }}
      >
        {ws.description || "No description"}
      </p>

      <div
        className="flex items-center justify-between"
        style={{ color: "var(--muted-foreground)", fontSize: "0.7rem" }}
      >
        <span className="flex items-center gap-1">
          <Globe size={9} /> {(ws.default_language || "en").toUpperCase()}
        </span>
        <span className="flex items-center gap-1">
          <Zap size={9} /> {ws.default_chat_model}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={9} /> {timeAgo(ws.updated_at)}
        </span>
      </div>
    </div>
  );
}
