import { apiClient } from "./client";
import type {
  Workspace,
  WorkspaceCreatePayload,
  WorkspaceUpdatePayload,
} from "@/types/api";

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const { data } = await apiClient.get("/workspaces");
  return Array.isArray(data) ? data : (data.workspaces ?? []);
}

export async function fetchWorkspace(id: string): Promise<Workspace> {
  const { data } = await apiClient.get(`/workspaces/${id}`);
  return data;
}

export async function createWorkspace(
  payload: WorkspaceCreatePayload,
): Promise<Workspace> {
  const { data } = await apiClient.post("/workspaces", payload);
  return data;
}

export async function updateWorkspace(
  id: string,
  payload: WorkspaceUpdatePayload,
): Promise<Workspace> {
  const { data } = await apiClient.patch(`/workspaces/${id}`, payload);
  return data;
}

export async function deleteWorkspace(id: string): Promise<void> {
  await apiClient.delete(`/workspaces/${id}`);
}
