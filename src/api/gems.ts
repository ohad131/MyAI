import { apiClient } from "./client";
import type { Gem, GemCreatePayload, GemUpdatePayload } from "@/types/api";

export async function fetchGems(workspaceId?: string): Promise<Gem[]> {
  const params: Record<string, string> = {};
  if (workspaceId) {
    params.workspace_id = workspaceId;
    params.include_global = "true";
  }
  const { data } = await apiClient.get("/gems", { params });
  return Array.isArray(data) ? data : (data.gems ?? []);
}

export async function createGem(payload: GemCreatePayload): Promise<Gem> {
  const { data } = await apiClient.post("/gems", payload);
  return data;
}

export async function updateGem(
  gemId: string,
  payload: GemUpdatePayload,
): Promise<Gem> {
  const { data } = await apiClient.patch(`/gems/${gemId}`, payload);
  return data;
}

export async function deleteGem(gemId: string): Promise<void> {
  await apiClient.delete(`/gems/${gemId}`);
}
