import type { Conversation } from "@/types/api";

const ACTIVE_CONVERSATION_PREFIX = "myai.activeConversation";

export function activeConversationStorageKey(workspaceId: string): string {
  return `${ACTIVE_CONVERSATION_PREFIX}.${workspaceId}`;
}

export function getPersistedActiveConversationId(
  workspaceId: string,
): string | null {
  try {
    return localStorage.getItem(activeConversationStorageKey(workspaceId));
  } catch {
    return null;
  }
}

export function setPersistedActiveConversationId(
  workspaceId: string,
  conversationId: string | null,
): void {
  try {
    const key = activeConversationStorageKey(workspaceId);
    if (conversationId) localStorage.setItem(key, conversationId);
    else localStorage.removeItem(key);
  } catch {
    /* localStorage unavailable */
  }
}

export function resolveRestoredConversationId(
  conversations: Conversation[],
  persistedConversationId: string | null,
): string | null {
  if (!persistedConversationId) return null;
  return conversations.some((conversation) => conversation.id === persistedConversationId)
    ? persistedConversationId
    : null;
}
