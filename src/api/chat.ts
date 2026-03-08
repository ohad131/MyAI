import { apiClient } from "./client";
import type { ChatRequest, Message } from "@/types/api";

export async function sendChatMessage(
  payload: ChatRequest,
  signal?: AbortSignal,
): Promise<Message> {
  const { data } = await apiClient.post("/chat", payload, { signal });

  if (data.message && data.message.role) return data.message;
  if (data.role === "assistant" || data.role === "user") return data as Message;

  return {
    id: data.id || String(Date.now()),
    conversation_id: data.conversation_id || payload.conversation_id,
    role: "assistant" as const,
    content:
      data.content ||
      data.response ||
      data.reply ||
      (typeof data === "string" ? data : JSON.stringify(data)),
    meta_json: data.meta_json ?? null,
    created_at: data.created_at || new Date().toISOString(),
  };
}

export async function checkHealth(): Promise<boolean> {
  try {
    await apiClient.get("/health", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
