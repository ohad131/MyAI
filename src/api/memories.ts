import { apiClient } from "./client";
import type {
  Memory,
  MemoryCreatePayload,
  MemoryScope,
  MemorySuggestion,
  MemorySuggestionStatus,
  MemoryType,
  MemoryUpdatePayload,
} from "@/types/api";

interface ListMemoriesParams {
  scope?: MemoryScope;
  scope_id?: string;
  type?: MemoryType;
  pinned?: boolean;
  enabled?: boolean;
}

interface ListMemorySuggestionsParams {
  status?: MemorySuggestionStatus;
  scope?: MemoryScope;
  scope_id?: string;
  type?: MemoryType;
}

export async function fetchMemories(
  params?: ListMemoriesParams,
): Promise<Memory[]> {
  const { data } = await apiClient.get("/memories", { params });
  return Array.isArray(data) ? data : [];
}

export async function createMemory(
  payload: MemoryCreatePayload,
): Promise<Memory> {
  const { data } = await apiClient.post("/memories", payload);
  return data;
}

export async function updateMemory(
  memoryId: string,
  payload: MemoryUpdatePayload,
): Promise<Memory> {
  const { data } = await apiClient.patch(`/memories/${memoryId}`, payload);
  return data;
}

export async function deleteMemory(memoryId: string): Promise<void> {
  await apiClient.delete(`/memories/${memoryId}`);
}

export async function fetchMemorySuggestions(
  params?: ListMemorySuggestionsParams,
): Promise<MemorySuggestion[]> {
  const { data } = await apiClient.get("/memory/suggestions", { params });
  return Array.isArray(data) ? data : [];
}

export async function approveMemorySuggestion(
  suggestionId: string,
  content?: string,
): Promise<void> {
  if (content !== undefined) {
    await apiClient.post(`/memory/suggestions/${suggestionId}/approve`, {
      content,
    });
    return;
  }
  await apiClient.post(`/memory/suggestions/${suggestionId}/approve`);
}

export async function rejectMemorySuggestion(
  suggestionId: string,
): Promise<void> {
  await apiClient.post(`/memory/suggestions/${suggestionId}/reject`);
}
