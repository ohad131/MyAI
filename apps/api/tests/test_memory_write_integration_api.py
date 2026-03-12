from fastapi.testclient import TestClient

from app.schemas.chat import ChatRequest
from app.services.chat_service import ChatService
from app.services.memory_write_service import MemoryWriteService


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


class FailingMemoryWriteService(MemoryWriteService):
    def generate_suggestions_for_chat_turn(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        raise RuntimeError("write service failure")


def create_workspace(client: TestClient) -> str:
    response = client.post(
        "/api/workspaces",
        json={
            "name": "Write WS",
            "description": "Workspace for write integration tests",
            "default_chat_model": "qwen3.5:9b",
            "default_language": "en",
            "use_global_memory": False,
            "global_memory_mode": "all",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_conversation(client: TestClient, workspace_id: str) -> str:
    response = client.post(
        "/api/conversations",
        json={
            "workspace_id": workspace_id,
            "title": "Write conversation",
            "model": "qwen3.5:9b",
            "think_enabled": False,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_chat_creates_pending_suggestion_visible_in_existing_api(client: TestClient, monkeypatch) -> None:
    workspace_id = create_workspace(client)
    conversation_id = create_conversation(client, workspace_id)

    import app.routers.chat as chat_router

    chat_router_service = ChatService(registry=FakeRegistry(FakeProvider()))
    monkeypatch.setattr(chat_router, "service", chat_router_service)

    payload = ChatRequest(
        workspace_id=workspace_id,
        conversation_id=conversation_id,
        user_message="I prefer concise answers with bullets.",
        selected_model="qwen3.5:9b",
        selected_gem_id=None,
        think=False,
    )

    response = client.post("/api/chat", json=payload.model_dump())
    assert response.status_code == 200

    suggestions = client.get(
        "/api/memory/suggestions",
        params={"status": "pending", "scope": "workspace", "scope_id": workspace_id},
    )
    assert suggestions.status_code == 200
    body = suggestions.json()
    assert any("I prefer concise answers" in item["proposed_content"] for item in body)
    assert any(item["status"] == "pending" for item in body)


def test_write_pipeline_failure_does_not_break_chat(client: TestClient, monkeypatch) -> None:
    workspace_id = create_workspace(client)
    conversation_id = create_conversation(client, workspace_id)

    import app.routers.chat as chat_router

    chat_router_service = ChatService(
        registry=FakeRegistry(FakeProvider()),
        memory_write_service=FailingMemoryWriteService(),
    )
    monkeypatch.setattr(chat_router, "service", chat_router_service)

    payload = ChatRequest(
        workspace_id=workspace_id,
        conversation_id=conversation_id,
        user_message="I prefer concise answers with bullets.",
        selected_model="qwen3.5:9b",
        selected_gem_id=None,
        think=False,
    )
    response = client.post("/api/chat", json=payload.model_dump())
    assert response.status_code == 200
    assert response.json()["assistant_message"] == "assistant response"
