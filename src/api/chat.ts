import { apiClient } from "./client";
import type { ChatRequest, ChatResponse, Message } from "@/types/api";

export async function sendChatMessage(
  payload: ChatRequest,
  signal?: AbortSignal,
): Promise<Message> {
  if (process.env.NODE_ENV !== "production") {
    console.info("[chat] POST /chat payload", JSON.stringify(payload));
  }

  const { data } = await apiClient.post("/chat", payload, { signal });
  const typed = data as Partial<ChatResponse>;

  if (
    typeof typed.assistant_message === "string" &&
    typeof typed.assistant_message_id === "string"
  ) {
    return {
      id: typed.assistant_message_id,
      conversation_id: typed.conversation_id || payload.conversation_id,
      role: "assistant",
      content: typed.assistant_message,
      meta_json: {
        model: typed.model ?? payload.selected_model,
        gem_id: typed.gem_id ?? payload.selected_gem_id,
        think:
          typeof typed.think === "boolean" ? typed.think : payload.think,
        provider: typed.provider ?? null,
      },
      created_at: new Date().toISOString(),
    };
  }

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
