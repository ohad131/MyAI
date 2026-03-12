import pytest
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.memory import Memory
from app.models.memory_usage_log import MemoryUsageLog
from app.models.workspace import Workspace
from app.schemas.memory_enums import MemoryScope
from app.schemas.chat import ChatRequest
from app.services.chat_service import ChatService
from app.services.memory_injection_service import TRUNCATION_MARKER
from app.services.memory_usage_log_service import MemoryUsageLogService


class FakeProvider:
    provider_name = "fake"

    def __init__(self) -> None:
        self.last_messages: list[dict[str, str]] = []

    async def list_models(self) -> list[str]:
        return ["qwen3.5:9b"]

    async def chat(self, model: str, messages: list[dict[str, str]], think: bool = False) -> dict[str, str]:
        self.last_messages = messages
        return {"content": "assistant response"}


class FakeRegistry:
    def __init__(self, provider: FakeProvider) -> None:
        self._provider = provider

    def default(self) -> FakeProvider:
        return self._provider


def create_workspace_and_conversation(db_session: Session) -> tuple[Workspace, Conversation]:
    workspace = Workspace(
        name="WS",
        description="test",
        default_chat_model="qwen3.5:9b",
        default_language="en",
        use_global_memory=False,
        global_memory_mode="all",
    )
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)

    conversation = Conversation(
        workspace_id=workspace.id,
        title="Test conversation",
        model="qwen3.5:9b",
        gem_id=None,
        think_enabled=False,
    )
    db_session.add(conversation)
    db_session.commit()
    db_session.refresh(conversation)
    return workspace, conversation


def create_workspace_memory(db_session: Session, workspace_id: str, content: str) -> Memory:
    memory = Memory(
        scope=MemoryScope.WORKSPACE.value,
        scope_id=workspace_id,
        type="fact",
        content=content,
        enabled=True,
        always_include=True,
        pinned=False,
        importance=0.9,
        confidence=1.0,
        times_used=0,
    )
    db_session.add(memory)
    db_session.commit()
    db_session.refresh(memory)
    return memory


@pytest.mark.anyio
async def test_chat_flow_valid_when_no_memories(db_session: Session) -> None:
    workspace, conversation = create_workspace_and_conversation(db_session)

    provider = FakeProvider()
    service = ChatService(registry=FakeRegistry(provider))
    payload = ChatRequest(
        workspace_id=workspace.id,
        conversation_id=conversation.id,
        user_message="hello",
        selected_model="qwen3.5:9b",
        selected_gem_id=None,
        think=False,
    )

    result = await service.execute_chat(db_session, payload)

    assert result.assistant_message == "assistant response"
    system_messages = [msg["content"] for msg in provider.last_messages if msg["role"] == "system"]
    assert all("Memory placeholder" not in content for content in system_messages)


@pytest.mark.anyio
async def test_chat_creates_memory_usage_logs_for_injected_memories(db_session: Session) -> None:
    workspace, conversation = create_workspace_and_conversation(db_session)
    memory = create_workspace_memory(db_session, workspace.id, "Always include this memory")

    provider = FakeProvider()
    service = ChatService(registry=FakeRegistry(provider))
    payload = ChatRequest(
        workspace_id=workspace.id,
        conversation_id=conversation.id,
        user_message="hello",
        selected_model="qwen3.5:9b",
        selected_gem_id=None,
        think=False,
    )

    await service.execute_chat(db_session, payload)

    logs = db_session.query(MemoryUsageLog).filter(MemoryUsageLog.conversation_id == conversation.id).all()
    assert len(logs) >= 1
    target = next((log for log in logs if log.memory_id == memory.id), None)
    assert target is not None
    assert target.injected is True
    assert target.selected is True
    assert target.rank_position == 1
    assert target.why_shown is not None
    assert "always_include" in target.why_shown
    assert "scope:workspace" in target.why_shown


@pytest.mark.anyio
async def test_usage_log_snippet_preview_preserves_head_and_tail(db_session: Session) -> None:
    workspace, conversation = create_workspace_and_conversation(db_session)
    create_workspace_memory(
        db_session,
        workspace.id,
        "HEAD_MEMORY start context " + ("filler " * 100) + "TAIL_MEMORY critical trailing instruction",
    )

    provider = FakeProvider()
    service = ChatService(registry=FakeRegistry(provider))
    payload = ChatRequest(
        workspace_id=workspace.id,
        conversation_id=conversation.id,
        user_message="hello",
        selected_model="qwen3.5:9b",
        selected_gem_id=None,
        think=False,
    )

    await service.execute_chat(db_session, payload)
    target = (
        db_session.query(MemoryUsageLog)
        .filter(MemoryUsageLog.conversation_id == conversation.id)
        .order_by(MemoryUsageLog.created_at.desc())
        .first()
    )
    assert target is not None
    assert target.snippet_preview is not None
    assert "HEAD_MEMORY start context" in target.snippet_preview
    assert "TAIL_MEMORY critical trailing instruction" in target.snippet_preview
    assert TRUNCATION_MARKER in target.snippet_preview


class FailingMemoryUsageLogService(MemoryUsageLogService):
    def log_injected_memories(self, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
        raise RuntimeError("logging failed")


@pytest.mark.anyio
async def test_memory_usage_logging_failure_does_not_break_chat(db_session: Session) -> None:
    workspace, conversation = create_workspace_and_conversation(db_session)
    create_workspace_memory(db_session, workspace.id, "Memory for failure test")

    provider = FakeProvider()
    service = ChatService(
        registry=FakeRegistry(provider),
        memory_usage_log_service=FailingMemoryUsageLogService(),
    )
    payload = ChatRequest(
        workspace_id=workspace.id,
        conversation_id=conversation.id,
        user_message="hello",
        selected_model="qwen3.5:9b",
        selected_gem_id=None,
        think=False,
    )

    result = await service.execute_chat(db_session, payload)
    assert result.assistant_message == "assistant response"
