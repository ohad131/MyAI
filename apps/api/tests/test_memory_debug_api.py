from fastapi.testclient import TestClient

from app.schemas.chat import ChatRequest
from app.services.memory_injection_service import TRUNCATION_MARKER
from app.services.chat_service import ChatService


class FakeProvider:
    provider_name = "fake"

    async def list_models(self) -> list[str]:
        return ["qwen3.5:9b"]

    async def chat(self, model: str, messages: list[dict[str, str]], think: bool = False) -> dict[str, str]:
        return {"content": "assistant response"}


class FakeRegistry:
    def __init__(self, provider: FakeProvider) -> None:
        self._provider = provider

    def default(self) -> FakeProvider:
        return self._provider


def create_workspace(client: TestClient, *, use_global_memory: bool = True, global_memory_mode: str = "all") -> str:
    response = client.post(
        "/api/workspaces",
        json={
            "name": "Debug WS",
            "description": "Workspace for debug tests",
            "default_chat_model": "qwen3.5:9b",
            "default_language": "en",
            "use_global_memory": use_global_memory,
            "global_memory_mode": global_memory_mode,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_conversation(client: TestClient, workspace_id: str) -> str:
    response = client.post(
        "/api/conversations",
        json={
            "workspace_id": workspace_id,
            "title": "Debug conversation",
            "model": "qwen3.5:9b",
            "think_enabled": False,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_memory(client: TestClient, payload: dict) -> str:
    response = client.post("/api/memories", json=payload)
    assert response.status_code == 201
    return response.json()["id"]


def test_retrieve_preview_matches_chat_selection_for_same_context(client: TestClient, monkeypatch) -> None:
    workspace_id = create_workspace(client, use_global_memory=True, global_memory_mode="all")
    conversation_id = create_conversation(client, workspace_id)
    workspace_memory_id = create_memory(
        client,
        {
            "scope": "workspace",
            "scope_id": workspace_id,
            "type": "fact",
            "content": "workspace memory",
            "always_include": True,
        },
    )
    global_memory_id = create_memory(
        client,
        {
            "scope": "global",
            "type": "fact",
            "content": "global memory",
            "pinned": True,
        },
    )

    preview_response = client.post(
        "/api/memory/retrieve-preview",
        json={"workspace_id": workspace_id, "conversation_id": conversation_id, "user_message": "hello"},
    )
    assert preview_response.status_code == 200
    preview_body = preview_response.json()
    preview_ids = [item["memory"]["id"] for item in preview_body["selected_memories"]]
    assert workspace_memory_id in preview_ids
    assert global_memory_id in preview_ids

    import app.routers.chat as chat_router

    chat_router_service = ChatService(registry=FakeRegistry(FakeProvider()))
    monkeypatch.setattr(chat_router, "service", chat_router_service)

    chat_payload = ChatRequest(
        workspace_id=workspace_id,
        conversation_id=conversation_id,
        user_message="hello",
        selected_model="qwen3.5:9b",
        selected_gem_id=None,
        think=False,
    )
    chat_response = client.post("/api/chat", json=chat_payload.model_dump())
    assert chat_response.status_code == 200
    assert chat_response.json()["assistant_message"] == "assistant response"

    logs_response = client.get(
        "/api/memory/usage-logs",
        params={"conversation_id": conversation_id, "injected_only": True, "limit": 20},
    )
    assert logs_response.status_code == 200
    logs = logs_response.json()
    logged_ids = [item["memory_id"] for item in sorted(logs, key=lambda entry: entry["rank_position"] or 999)]

    assert logged_ids[: len(preview_ids)] == preview_ids


def test_usage_logs_endpoint_filters_by_conversation_and_limit(client: TestClient, monkeypatch) -> None:
    workspace_id = create_workspace(client, use_global_memory=False)
    conversation_id = create_conversation(client, workspace_id)
    create_memory(
        client,
        {
            "scope": "workspace",
            "scope_id": workspace_id,
            "type": "fact",
            "content": "memory one",
            "always_include": True,
        },
    )

    import app.routers.chat as chat_router

    chat_router_service = ChatService(registry=FakeRegistry(FakeProvider()))
    monkeypatch.setattr(chat_router, "service", chat_router_service)

    payload = ChatRequest(
        workspace_id=workspace_id,
        conversation_id=conversation_id,
        user_message="hello",
        selected_model="qwen3.5:9b",
        selected_gem_id=None,
        think=False,
    )

    # Create at least two chat turns to test limiting.
    client.post("/api/chat", json=payload.model_dump())
    client.post("/api/chat", json=payload.model_dump())

    response = client.get(
        "/api/memory/usage-logs",
        params={"conversation_id": conversation_id, "limit": 1},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["conversation_id"] == conversation_id


def test_retrieve_preview_empty_case(client: TestClient) -> None:
    workspace_id = create_workspace(client, use_global_memory=False)
    response = client.post(
        "/api/memory/retrieve-preview",
        json={"workspace_id": workspace_id, "user_message": "hello"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["selected_memories"] == []
    assert body["memory_block"] == ""


def test_retrieve_preview_uses_safe_head_tail_clipping(client: TestClient) -> None:
    workspace_id = create_workspace(client, use_global_memory=False)
    long_content = (
        "HEAD_CONTEXT: keep this beginning. "
        + ("filler " * 100)
        + "TAIL_CRITICAL: preserve this trailing meaning."
    )
    create_memory(
        client,
        {
            "scope": "workspace",
            "scope_id": workspace_id,
            "type": "fact",
            "content": long_content,
            "always_include": True,
        },
    )

    response = client.post(
        "/api/memory/retrieve-preview",
        json={"workspace_id": workspace_id, "user_message": "hello"},
    )
    assert response.status_code == 200
    block = response.json()["memory_block"]

    assert "HEAD_CONTEXT: keep this beginning." in block
    assert "TAIL_CRITICAL: preserve this trailing meaning." in block
    assert TRUNCATION_MARKER in block
