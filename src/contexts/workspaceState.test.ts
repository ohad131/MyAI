import { describe, expect, it } from "vitest";
import { resolveActiveWorkspaceId } from "@/contexts/workspaceState";

const workspaceA = {
  id: "ws-a",
  name: "Workspace A",
  description: "",
  default_chat_model: "qwen3.5:9b",
  default_gem_id: null,
  default_language: "en",
  use_global_memory: false,
  global_memory_mode: "workspace",
  created_at: "2026-03-09T00:00:00.000Z",
  updated_at: "2026-03-09T00:00:00.000Z",
};

const workspaceB = {
  ...workspaceA,
  id: "ws-b",
  name: "Workspace B",
};

describe("resolveActiveWorkspaceId", () => {
  it("keeps active workspace during loading or failed fetch", () => {
    expect(
      resolveActiveWorkspaceId({
        activeWorkspaceId: "ws-a",
        workspaces: [],
        loadStatus: "loading",
      }),
    ).toBe("ws-a");

    expect(
      resolveActiveWorkspaceId({
        activeWorkspaceId: "ws-a",
        workspaces: [],
        loadStatus: "error",
      }),
    ).toBe("ws-a");
  });

  it("keeps active workspace when successful load still contains it", () => {
    expect(
      resolveActiveWorkspaceId({
        activeWorkspaceId: "ws-a",
        workspaces: [workspaceA, workspaceB],
        loadStatus: "success",
      }),
    ).toBe("ws-a");
  });

  it("clears active workspace only after successful load proves it invalid", () => {
    expect(
      resolveActiveWorkspaceId({
        activeWorkspaceId: "ws-a",
        workspaces: [workspaceB],
        loadStatus: "success",
      }),
    ).toBeNull();
  });
});
