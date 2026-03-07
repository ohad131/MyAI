import { apiClient } from "./client";
import type {
  Conversation,
  ConversationCreatePayload,
  ConversationUpdatePayload,
  Message,
} from "@/types/api";

export async function fetchConversations(
  workspaceId: string,
): Promise<Conversation[]> {
  const { data } = await apiClient.get("/conversations", {
    params: { workspace_id: workspaceId },
  });
  return Array.isArray(data) ? data : (data.conversations ?? []);
}

export async function fetchConversation(id: string): Promise<Conversation> {
  const { data } = await apiClient.get(`/conversations/${id}`);
  return data;
}

export async function createConversation(
  payload: ConversationCreatePayload,
): Promise<Conversation> {
  const { data } = await apiClient.post("/conversations", payload);
  return data;
}

export async function updateConversation(
  id: string,
  payload: ConversationUpdatePayload,
): Promise<Conversation> {
  const { data } = await apiClient.patch(`/conversations/${id}`, payload);
  return data;
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/conversations/${id}`);
}

export async function fetchMessages(
  conversationId: string,
): Promise<Message[]> {
  const { data } = await apiClient.get(
    `/conversations/${conversationId}/messages`,
  );
  return Array.isArray(data) ? data : (data.messages ?? []);
}
