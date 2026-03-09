import type { Workspace } from "@/types/api";

export type WorkspaceLoadStatus = "loading" | "error" | "success";

interface ResolveActiveWorkspaceInput {
  activeWorkspaceId: string | null;
  workspaces: Workspace[];
  loadStatus: WorkspaceLoadStatus;
}

export function resolveActiveWorkspaceId({
  activeWorkspaceId,
  workspaces,
  loadStatus,
}: ResolveActiveWorkspaceInput): string | null {
  if (!activeWorkspaceId) return null;

  // Never clear persisted selection on transient failures.
  if (loadStatus !== "success") return activeWorkspaceId;

  return workspaces.some((workspace) => workspace.id === activeWorkspaceId)
    ? activeWorkspaceId
    : null;
}
