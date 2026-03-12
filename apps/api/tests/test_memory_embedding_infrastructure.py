import json

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.memory import Memory
from app.models.memory_embedding import MemoryEmbedding
from app.models.workspace import Workspace
from app.schemas.memory import MemoryCreate, MemoryUpdate
from app.schemas.memory_enums import MemoryScope, MemoryType
from app.schemas.memory_suggestion import MemorySuggestionCreate
from app.services.memory_embedding_service import MemoryEmbeddingService
from app.services.memory_service import MemoryService
from app.services.memory_suggestion_service import MemorySuggestionService


class FakeEmbeddingProvider:
    provider_name = "fake"

    def __init__(self) -> None:
        self.calls: list[str] = []

    def embed(self, *, model: str, text: str) -> list[float]:
        self.calls.append(text)
        return [float(len(text)), float(len(self.calls))]


class FailingEmbeddingProvider:
    provider_name = "fake"

    def embed(self, *, model: str, text: str) -> list[float]:
        raise RuntimeError("embedding failed")


def create_workspace(db_session: Session) -> Workspace:
    workspace = Workspace(
        name="Embedding WS",
        description="Embedding tests",
        default_chat_model="qwen3.5:9b",
        default_language="en",
        use_global_memory=False,
        global_memory_mode="all",
    )
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)
    return workspace


def get_embedding_row(db_session: Session, memory_id: str) -> MemoryEmbedding | None:
    stmt = select(MemoryEmbedding).where(MemoryEmbedding.memory_id == memory_id)
    return db_session.scalar(stmt)


def test_embedding_record_created_on_memory_create(db_session: Session, monkeypatch) -> None:
    monkeypatch.setattr(settings, "memory_embedding_enabled", True)
    monkeypatch.setattr(settings, "memory_embedding_provider", "ollama")
    monkeypatch.setattr(settings, "memory_embedding_model", "nomic-embed-text")

    provider = FakeEmbeddingProvider()
    memory_service = MemoryService(
        memory_embedding_service=MemoryEmbeddingService(provider=provider),
    )
    workspace = create_workspace(db_session)
    memory = memory_service.create_memory(
        db_session,
        MemoryCreate(
            scope=MemoryScope.WORKSPACE,
            scope_id=workspace.id,
            type=MemoryType.FACT,
            content="User prefers concise answers.",
        ),
    )

    row = get_embedding_row(db_session, memory.id)
    assert row is not None
    assert row.status == "ready"
    assert row.provider == "ollama"
    assert row.model == "nomic-embed-text"
    assert row.dimensions == 2
    assert json.loads(row.embedding_json or "[]")
    assert provider.calls == ["User prefers concise answers."]


def test_embedding_record_updated_when_memory_content_changes(db_session: Session, monkeypatch) -> None:
    monkeypatch.setattr(settings, "memory_embedding_enabled", True)
    monkeypatch.setattr(settings, "memory_embedding_provider", "ollama")
    monkeypatch.setattr(settings, "memory_embedding_model", "nomic-embed-text")

    provider = FakeEmbeddingProvider()
    memory_service = MemoryService(
        memory_embedding_service=MemoryEmbeddingService(provider=provider),
    )
    workspace = create_workspace(db_session)
    memory = memory_service.create_memory(
        db_session,
        MemoryCreate(
            scope=MemoryScope.WORKSPACE,
            scope_id=workspace.id,
            type=MemoryType.FACT,
            content="Initial memory content",
        ),
    )
    initial_row = get_embedding_row(db_session, memory.id)
    assert initial_row is not None
    initial_hash = initial_row.content_hash

    memory_service.update_memory(
        db_session,
        memory.id,
        MemoryUpdate(content="Updated memory content"),
    )
    updated_row = get_embedding_row(db_session, memory.id)
    assert updated_row is not None
    assert updated_row.content_hash != initial_hash
    assert updated_row.status == "ready"
    assert provider.calls == ["Initial memory content", "Updated memory content"]


def test_embedding_not_regenerated_when_content_hash_unchanged(db_session: Session, monkeypatch) -> None:
    monkeypatch.setattr(settings, "memory_embedding_enabled", True)
    monkeypatch.setattr(settings, "memory_embedding_provider", "ollama")
    monkeypatch.setattr(settings, "memory_embedding_model", "nomic-embed-text")

    provider = FakeEmbeddingProvider()
    memory_service = MemoryService(
        memory_embedding_service=MemoryEmbeddingService(provider=provider),
    )
    workspace = create_workspace(db_session)
    memory = memory_service.create_memory(
        db_session,
        MemoryCreate(
            scope=MemoryScope.WORKSPACE,
            scope_id=workspace.id,
            type=MemoryType.FACT,
            content="Stable memory content",
        ),
    )

    memory_service.update_memory(
        db_session,
        memory.id,
        MemoryUpdate(content="Stable memory content"),
    )
    row = get_embedding_row(db_session, memory.id)
    assert row is not None
    assert row.status == "ready"
    assert len(provider.calls) == 1


def test_suggestion_approval_triggers_embedding_creation(db_session: Session, monkeypatch) -> None:
    monkeypatch.setattr(settings, "memory_embedding_enabled", True)
    monkeypatch.setattr(settings, "memory_embedding_provider", "ollama")
    monkeypatch.setattr(settings, "memory_embedding_model", "nomic-embed-text")

    provider = FakeEmbeddingProvider()
    memory_service = MemoryService(
        memory_embedding_service=MemoryEmbeddingService(provider=provider),
    )
    suggestion_service = MemorySuggestionService(memory_service=memory_service)
    workspace = create_workspace(db_session)

    suggestion = suggestion_service.create_suggestion(
        db_session,
        MemorySuggestionCreate(
            scope=MemoryScope.WORKSPACE,
            scope_id=workspace.id,
            type=MemoryType.INSTRUCTION,
            proposed_content="Always keep answers short.",
        ),
    )

    result = suggestion_service.approve_suggestion(db_session, suggestion.id, payload=None)
    memory_id = result["memory"].id
    row = get_embedding_row(db_session, memory_id)
    assert row is not None
    assert row.status == "ready"
    assert len(provider.calls) == 1


def test_embedding_failure_does_not_break_create_update_or_approve(db_session: Session, monkeypatch) -> None:
    monkeypatch.setattr(settings, "memory_embedding_enabled", True)
    monkeypatch.setattr(settings, "memory_embedding_provider", "ollama")
    monkeypatch.setattr(settings, "memory_embedding_model", "nomic-embed-text")

    memory_service = MemoryService(
        memory_embedding_service=MemoryEmbeddingService(provider=FailingEmbeddingProvider()),
    )
    suggestion_service = MemorySuggestionService(memory_service=memory_service)
    workspace = create_workspace(db_session)

    created = memory_service.create_memory(
        db_session,
        MemoryCreate(
            scope=MemoryScope.WORKSPACE,
            scope_id=workspace.id,
            type=MemoryType.FACT,
            content="Create should still succeed",
        ),
    )
    memory_service.update_memory(
        db_session,
        created.id,
        MemoryUpdate(content="Update should still succeed"),
    )

    suggestion = suggestion_service.create_suggestion(
        db_session,
        MemorySuggestionCreate(
            scope=MemoryScope.WORKSPACE,
            scope_id=workspace.id,
            type=MemoryType.FACT,
            proposed_content="Approve should still succeed",
        ),
    )
    approval = suggestion_service.approve_suggestion(db_session, suggestion.id, payload=None)

    created_row = get_embedding_row(db_session, created.id)
    approved_row = get_embedding_row(db_session, approval["memory"].id)
    assert created_row is not None
    assert created_row.status == "error"
    assert created_row.error_message == "embedding failed"
    assert approved_row is not None
    assert approved_row.status == "error"
    assert approved_row.error_message == "embedding failed"


def test_rebuild_endpoint_processes_existing_memories_and_returns_summary(
    client: TestClient,
    db_session: Session,
    monkeypatch,
) -> None:
    monkeypatch.setattr(settings, "memory_embedding_enabled", True)
    monkeypatch.setattr(settings, "memory_embedding_provider", "ollama")
    monkeypatch.setattr(settings, "memory_embedding_model", "nomic-embed-text")

    for index in range(2):
        db_session.add(
            Memory(
                scope=MemoryScope.GLOBAL.value,
                scope_id=None,
                type=MemoryType.FACT.value,
                content=f"Global memory {index}",
                enabled=True,
                pinned=False,
                always_include=False,
                importance=0.5,
                confidence=1.0,
                times_used=0,
            )
        )
    db_session.commit()

    import app.routers.memory_debug as memory_debug_router

    monkeypatch.setattr(
        memory_debug_router,
        "memory_embedding_service",
        MemoryEmbeddingService(provider=FakeEmbeddingProvider()),
    )

    first = client.post("/api/memory/index/rebuild")
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["processed"] == 2
    assert first_body["created"] == 2
    assert first_body["updated"] == 0
    assert first_body["skipped"] == 0
    assert first_body["failed"] == 0

    second = client.post("/api/memory/index/rebuild")
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["processed"] == 2
    assert second_body["created"] == 0
    assert second_body["updated"] == 0
    assert second_body["skipped"] == 2
    assert second_body["failed"] == 0
