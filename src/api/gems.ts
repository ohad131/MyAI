import { apiClient } from "./client";
import type { Gem } from "@/types/api";

export async function fetchGems(workspaceId?: string): Promise<Gem[]> {
  const params: Record<string, string> = {};
  if (workspaceId) {
    params.workspace_id = workspaceId;
    params.include_global = "true";
  }
  const { data } = await apiClient.get("/gems", { params });
  return Array.isArray(data) ? data : (data.gems ?? []);
}
