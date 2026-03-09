import { describe, expect, it } from "vitest";
import {
  activeConversationStorageKey,
  resolveRestoredConversationId,
} from "@/views/chatConversationPersistence";

const conversationA = {
  id: "conv-a",
  workspace_id: "ws-a",
  title: "Conversation A",
  model: "qwen3.5:9b",
  gem_id: null,
  think_enabled: false,
  created_at: "2026-03-09T00:00:00.000Z",
  updated_at: "2026-03-09T00:00:00.000Z",
};

const conversationB = {
  ...conversationA,
  id: "conv-b",
  title: "Conversation B",
};

describe("chat conversation persistence", () => {
  it("uses a workspace-scoped localStorage key", () => {
    expect(activeConversationStorageKey("ws-a")).toBe(
      "myai.activeConversation.ws-a",
    );
    expect(activeConversationStorageKey("ws-a")).not.toBe(
      activeConversationStorageKey("ws-b"),
    );
  });

  it("restores a persisted conversation only when it still exists", () => {
    expect(
      resolveRestoredConversationId([conversationA, conversationB], "conv-b"),
    ).toBe("conv-b");
    expect(resolveRestoredConversationId([conversationA], "conv-b")).toBeNull();
    expect(resolveRestoredConversationId([conversationA], null)).toBeNull();
  });
});
