from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.gem import Gem
from app.models.memory import Memory
from app.models.memory_suggestion import MemorySuggestion
from app.models.workspace import Workspace
from app.schemas.memory_enums import MemoryScope
from app.services.memory_write_service import MAX_SUGGESTIONS_PER_MESSAGE, MemoryWriteService


def create_workspace(db_session: Session) -> Workspace:
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
    return workspace


def create_memory(db_session: Session, *, workspace_id: str, content: str) -> Memory:
    memory = Memory(
        scope=MemoryScope.WORKSPACE.value,
        scope_id=workspace_id,
        type="preference",
        content=content,
        enabled=True,
        always_include=False,
        pinned=False,
        importance=0.5,
        confidence=1.0,
        times_used=0,
    )
    db_session.add(memory)
    db_session.commit()
    db_session.refresh(memory)
    return memory


def create_suggestion(
    db_session: Session,
    *,
    scope: str,
    scope_id: str | None,
    content: str,
    status: str,
) -> MemorySuggestion:
    suggestion = MemorySuggestion(
        source_conversation_id="conv-x",
        source_message_id="msg-x",
        scope=scope,
        scope_id=scope_id,
        type="preference",
        proposed_content=content,
        status=status,
        confidence=0.8,
        reason="test",
    )
    db_session.add(suggestion)
    db_session.commit()
    db_session.refresh(suggestion)
    return suggestion


def test_durable_preference_creates_pending_suggestion(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    service = MemoryWriteService()

    created_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-1",
        message_id="msg-1",
        user_message="I prefer short answers with bullets.",
        gem_id=None,
    )

    assert len(created_ids) == 1
    created = db_session.get(MemorySuggestion, created_ids[0])
    assert created is not None
    assert created.status == "pending"
    assert created.scope == MemoryScope.WORKSPACE.value
    assert created.reason == "pattern:durable_preference"


def test_hebrew_durable_preference_creates_pending_suggestion(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    service = MemoryWriteService()

    created_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-he-1",
        message_id="msg-he-1",
        user_message="אני מעדיף תשובות קצרות עם נקודות.",
        gem_id=None,
    )

    assert len(created_ids) == 1
    created = db_session.get(MemorySuggestion, created_ids[0])
    assert created is not None
    assert created.status == "pending"
    assert created.reason == "pattern:durable_preference"


def test_profile_fact_and_instruction_patterns_create_suggestions(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    service = MemoryWriteService()

    created_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-2",
        message_id="msg-2",
        user_message="I study economics. Always keep answers concise.",
        gem_id=None,
    )

    assert len(created_ids) == 2


def test_hebrew_profile_fact_and_instruction_create_suggestions(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    service = MemoryWriteService()

    created_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-he-2",
        message_id="msg-he-2",
        user_message="אני לומד מדעי המחשב. תשמור על תשובות קצרות.",
        gem_id=None,
    )

    assert len(created_ids) == 2


def test_short_or_transient_message_does_not_create_suggestion(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    service = MemoryWriteService()

    created_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-3",
        message_id="msg-3",
        user_message="for this message, right now do this",
        gem_id=None,
    )
    assert created_ids == []


def test_transient_hebrew_message_does_not_create_suggestion(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    service = MemoryWriteService()

    created_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-he-3",
        message_id="msg-he-3",
        user_message="לצורך השיחה הזאת היום אני צריך משהו חד פעמי.",
        gem_id=None,
    )
    assert created_ids == []


def test_duplicate_memory_and_pending_are_skipped(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    create_memory(db_session, workspace_id=workspace.id, content="I prefer short answers")
    create_suggestion(
        db_session,
        scope=MemoryScope.WORKSPACE.value,
        scope_id=workspace.id,
        content="I prefer short answers",
        status="pending",
    )
    service = MemoryWriteService()

    created_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-4",
        message_id="msg-4",
        user_message="I prefer short answers.",
        gem_id=None,
    )

    assert created_ids == []


def test_recent_rejected_cooldown_prevents_recreation(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    suggestion = create_suggestion(
        db_session,
        scope=MemoryScope.WORKSPACE.value,
        scope_id=workspace.id,
        content="I prefer concise responses",
        status="rejected",
    )
    suggestion.updated_at = datetime.now(UTC)
    db_session.add(suggestion)
    db_session.commit()

    service = MemoryWriteService()
    created_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-5",
        message_id="msg-5",
        user_message="I prefer concise responses",
        gem_id=None,
    )
    assert created_ids == []


def test_scope_selection_is_conservative_and_gem_specific_only_when_explicit(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    gem = Gem(name="G", system_prompt="prompt", is_global=False, workspace_id=workspace.id)
    db_session.add(gem)
    db_session.commit()
    db_session.refresh(gem)

    service = MemoryWriteService()
    workspace_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-6",
        message_id="msg-6",
        user_message="I prefer concise replies.",
        gem_id=gem.id,
    )
    gem_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-6",
        message_id="msg-7",
        user_message="For this gem, always answer formally.",
        gem_id=gem.id,
    )

    workspace_suggestion = db_session.get(MemorySuggestion, workspace_ids[0])
    gem_suggestion = db_session.get(MemorySuggestion, gem_ids[0])
    assert workspace_suggestion is not None
    assert gem_suggestion is not None
    assert workspace_suggestion.scope == MemoryScope.WORKSPACE.value
    assert gem_suggestion.scope == MemoryScope.GEM.value
    assert gem_suggestion.scope_id == gem.id


def test_contradiction_and_cap_handling(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    create_memory(db_session, workspace_id=workspace.id, content="always answer in english")
    service = MemoryWriteService()

    created_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-7",
        message_id="msg-7",
        user_message=(
            "Never answer in english. "
            "I prefer bullet points. "
            "My goal is to learn python. "
            "Always keep answers short."
        ),
        gem_id=None,
    )

    assert len(created_ids) <= MAX_SUGGESTIONS_PER_MESSAGE


def test_hebrew_contradiction_is_blocked(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    create_memory(db_session, workspace_id=workspace.id, content="תמיד תענה באנגלית")
    service = MemoryWriteService()

    created_ids = service.generate_suggestions_for_chat_turn(
        db_session,
        workspace=workspace,
        conversation_id="conv-he-4",
        message_id="msg-he-4",
        user_message="אף פעם אל תענה באנגלית.",
        gem_id=None,
    )

    assert created_ids == []
