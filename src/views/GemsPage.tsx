"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { createGem, deleteGem, fetchGems, updateGem } from "@/api/gems";
import { getErrorMessage } from "@/api/client";
import type { Gem } from "@/types/api";
import { toast } from "sonner";
import LiquidButton from "@/components/LiquidButton";
import { Loader2, Plus, Search, Sparkles, LayoutGrid, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function GemsPage() {
  const router = useRouter();
  const {
    activeWorkspace,
    activeWorkspaceId,
    workspacesLoading,
    workspaceBootstrapReady,
  } = useWorkspaceContext();

  const [gems, setGems] = useState<Gem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGem, setEditingGem] = useState<Gem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gem | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formPrompt, setFormPrompt] = useState("");

  const loadGems = async () => {
    if (!activeWorkspaceId) {
      setGems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGems(activeWorkspaceId);
      setGems(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  const openCreateDialog = () => {
    setEditingGem(null);
    setFormName("");
    setFormPrompt("");
    setDialogOpen(true);
  };

  const openEditDialog = (gem: Gem) => {
    setEditingGem(gem);
    setFormName(gem.name);
    setFormPrompt(gem.system_prompt || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!activeWorkspaceId) return;
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formPrompt.trim()) {
      toast.error("System prompt is required");
      return;
    }

    setSaving(true);
    try {
      if (editingGem) {
        await updateGem(editingGem.id, {
          name: formName.trim(),
          system_prompt: formPrompt.trim(),
        });
        toast.success("Gem updated");
      } else {
        await createGem({
          name: formName.trim(),
          system_prompt: formPrompt.trim(),
          is_global: false,
          workspace_id: activeWorkspaceId,
        });
        toast.success("Gem created");
      }
      setDialogOpen(false);
      await loadGems();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGem(deleteTarget.id);
      toast.success("Gem deleted");
      setDeleteTarget(null);
      await loadGems();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filteredGems = useMemo(() => {
    const q = search.toLowerCase();
    return gems.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.system_prompt || "").toLowerCase().includes(q),
    );
  }, [gems, search]);

  if (!workspaceBootstrapReady) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--metal)" }} />
      </div>
    );
  }

  if (workspacesLoading && !activeWorkspace && activeWorkspaceId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={22} className="animate-spin" style={{ color: "var(--metal)" }} />
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
            Select a workspace before managing gems.
          </p>
          <LiquidButton onClick={() => router.push("/")} size="sm">
            Go to Workspaces
          </LiquidButton>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto lg-scroll" style={{ scrollbarGutter: "stable" }}>
      <div className="max-w-4xl mx-auto px-8 pt-8 pb-12">
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight mb-1"
              style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
            >
              Gems
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Create and manage reusable assistant personas
            </p>
          </div>
          <LiquidButton onClick={openCreateDialog} size="sm">
            <Plus size={12} />
            New gem
          </LiquidButton>
        </div>

        <div className="relative mb-6">
          <Search
            size={13}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            className="lg-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            placeholder="Search gems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
            <LiquidButton onClick={loadGems} size="sm">
              Retry
            </LiquidButton>
          </div>
        )}

        {!loading && !error && gems.length === 0 && (
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
            <h3 className="text-base font-medium mb-2" style={{ color: "var(--foreground)" }}>
              No gems yet
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
              Create your first gem for this workspace.
            </p>
            <LiquidButton onClick={openCreateDialog} size="sm">
              <Plus size={12} /> Create gem
            </LiquidButton>
          </div>
        )}

        {!loading && !error && filteredGems.length > 0 && (
          <section>
            <div className="grid grid-cols-2 gap-3">
              {filteredGems.map((gem) => (
                <div key={gem.id} className="lg-panel rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <h3 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {gem.name}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                        {gem.workspace_id ? "Workspace gem" : "Global gem"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditDialog(gem)}
                        className="lg-btn w-7 h-7 rounded-xl flex items-center justify-center"
                        title="Edit gem"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(gem)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center"
                        title="Delete gem"
                        style={{
                          color: "#ef4444",
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p
                    className="text-xs line-clamp-4"
                    style={{ color: "var(--muted-foreground)", lineHeight: 1.55 }}
                  >
                    {gem.system_prompt}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && !error && gems.length > 0 && filteredGems.length === 0 && (
          <p className="text-center py-12 text-sm" style={{ color: "var(--muted-foreground)" }}>
            No gems matching &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

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
              {editingGem ? "Edit gem" : "New gem"}
            </DialogTitle>
            <DialogDescription>
              {editingGem
                ? "Update the name or system prompt for this gem."
                : "Define a reusable assistant persona with a name and system prompt."}
            </DialogDescription>
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
                placeholder="Gem name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: "var(--muted-foreground)" }}
              >
                System prompt
              </label>
              <textarea
                className="lg-input w-full px-3 py-2 rounded-xl text-sm resize-none"
                placeholder="How this gem should behave"
                value={formPrompt}
                onChange={(e) => setFormPrompt(e.target.value)}
                rows={7}
              />
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
              disabled={saving || !formName.trim() || !formPrompt.trim()}
              size="sm"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : null}
              {editingGem ? "Save" : "Create"}
            </LiquidButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "var(--foreground)" }}>Delete gem</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;?
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
