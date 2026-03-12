from sqlalchemy.orm import Session

from app.models.gem import Gem
from app.models.memory import Memory
from app.models.workspace import Workspace
from app.schemas.memory_enums import MemoryScope
from app.services.memory_injection_service import (
    MAX_PER_SCOPE,
    MAX_SELECTED_MEMORIES,
    TRUNCATION_MARKER,
    MemoryInjectionService,
)
from app.services.prompt_builder import BASE_SYSTEM_PROMPT, build_prompt_messages


def create_workspace(
    db_session: Session,
    *,
    use_global_memory: bool = False,
    global_memory_mode: str = "all",
) -> Workspace:
    workspace = Workspace(
        name="WS",
        description="test",
        default_chat_model="qwen3.5:9b",
        default_language="en",
        use_global_memory=use_global_memory,
        global_memory_mode=global_memory_mode,
    )
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)
    return workspace


def create_memory(
    db_session: Session,
    *,
    scope: str,
    scope_id: str | None,
    content: str,
    enabled: bool = True,
    always_include: bool = False,
    pinned: bool = False,
    importance: float = 0.5,
) -> Memory:
    memory = Memory(
        scope=scope,
        scope_id=scope_id,
        type="fact",
        content=content,
        enabled=enabled,
        always_include=always_include,
        pinned=pinned,
        importance=importance,
        confidence=1.0,
        times_used=0,
    )
    db_session.add(memory)
    db_session.commit()
    db_session.refresh(memory)
    return memory


def test_selection_respects_enabled_and_priority(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    create_memory(
        db_session,
        scope=MemoryScope.WORKSPACE.value,
        scope_id=workspace.id,
        content="disabled always include",
        enabled=False,
        always_include=True,
    )
    always = create_memory(
        db_session,
        scope=MemoryScope.WORKSPACE.value,
        scope_id=workspace.id,
        content="always include",
        always_include=True,
    )
    pinned = create_memory(
        db_session,
        scope=MemoryScope.WORKSPACE.value,
        scope_id=workspace.id,
        content="pinned",
        pinned=True,
    )
    regular = create_memory(
        db_session,
        scope=MemoryScope.WORKSPACE.value,
        scope_id=workspace.id,
        content="regular",
    )

    service = MemoryInjectionService()
    selected = service.select_for_chat(db_session, workspace=workspace, gem_id=None)
    ids = [memory.id for memory in selected]

    assert ids[:3] == [always.id, pinned.id, regular.id]
    assert all(memory.enabled for memory in selected)


def test_global_memory_mode_pinned_only(db_session: Session) -> None:
    workspace = create_workspace(db_session, use_global_memory=True, global_memory_mode="pinned_only")
    global_unpinned = create_memory(
        db_session,
        scope=MemoryScope.GLOBAL.value,
        scope_id=None,
        content="global unpinned",
        pinned=False,
    )
    global_pinned = create_memory(
        db_session,
        scope=MemoryScope.GLOBAL.value,
        scope_id=None,
        content="global pinned",
        pinned=True,
    )

    service = MemoryInjectionService()
    selected = service.select_for_chat(db_session, workspace=workspace, gem_id=None)
    ids = {memory.id for memory in selected}

    assert global_pinned.id in ids
    assert global_unpinned.id not in ids


def test_scope_inclusion_workspace_global_gem(db_session: Session) -> None:
    workspace = create_workspace(db_session, use_global_memory=True, global_memory_mode="all")
    gem = Gem(
        name="Gem",
        system_prompt="prompt",
        is_global=False,
        workspace_id=workspace.id,
    )
    db_session.add(gem)
    db_session.commit()
    db_session.refresh(gem)

    workspace_memory = create_memory(
        db_session,
        scope=MemoryScope.WORKSPACE.value,
        scope_id=workspace.id,
        content="workspace memory",
    )
    global_memory = create_memory(
        db_session,
        scope=MemoryScope.GLOBAL.value,
        scope_id=None,
        content="global memory",
    )
    gem_memory = create_memory(
        db_session,
        scope=MemoryScope.GEM.value,
        scope_id=gem.id,
        content="gem memory",
    )

    service = MemoryInjectionService()
    selected = service.select_for_chat(db_session, workspace=workspace, gem_id=gem.id)
    ids = {memory.id for memory in selected}

    assert workspace_memory.id in ids
    assert global_memory.id in ids
    assert gem_memory.id in ids


def test_selection_caps_and_blank_content_skipped(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    create_memory(
        db_session,
        scope=MemoryScope.WORKSPACE.value,
        scope_id=workspace.id,
        content="   ",
    )
    for index in range(12):
        create_memory(
            db_session,
            scope=MemoryScope.WORKSPACE.value,
            scope_id=workspace.id,
            content=f"memory {index}",
        )

    service = MemoryInjectionService()
    selected = service.select_for_chat(db_session, workspace=workspace, gem_id=None)

    assert len(selected) == min(MAX_SELECTED_MEMORIES, MAX_PER_SCOPE[MemoryScope.WORKSPACE.value])
    assert all(memory.content.strip() for memory in selected)


def test_prompt_builder_uses_real_memory_block() -> None:
    memory_block = "Relevant saved memory:\n- [Workspace] User prefers short answers."
    messages = build_prompt_messages(
        history=[],
        current_user_message="hello",
        gem=None,
        memory_block=memory_block,
    )

    system_messages = [msg["content"] for msg in messages if msg["role"] == "system"]
    assert BASE_SYSTEM_PROMPT in system_messages
    assert memory_block in system_messages
    assert all("Memory placeholder" not in content for content in system_messages)


def test_why_shown_contains_stable_compact_reasons(db_session: Session) -> None:
    workspace = create_workspace(db_session, use_global_memory=True, global_memory_mode="pinned_only")
    memory = create_memory(
        db_session,
        scope=MemoryScope.GLOBAL.value,
        scope_id=None,
        content="global memory",
        always_include=True,
        pinned=True,
        importance=0.95,
    )

    service = MemoryInjectionService()
    result = service.select_for_chat_with_explanations(db_session, workspace=workspace, gem_id=None)
    item = next((entry for entry in result.items if entry.memory.id == memory.id), None)

    assert item is not None
    assert "always_include" in item.why_shown
    assert "pinned" in item.why_shown
    assert "high_importance" in item.why_shown
    assert "scope:global:pinned_only_mode" in item.why_shown


def test_long_memory_clipping_preserves_head_and_tail_in_prompt_block(db_session: Session) -> None:
    workspace = create_workspace(db_session)
    long_content = (
        "START important setup context with constraints and assumptions. "
        + ("filler " * 80)
        + "CRITICAL_TAIL: final instruction says answer in Hebrew only when explicitly requested."
    )
    create_memory(
        db_session,
        scope=MemoryScope.WORKSPACE.value,
        scope_id=workspace.id,
        content=long_content,
        always_include=True,
    )

    service = MemoryInjectionService()
    result = service.select_for_chat_with_explanations(db_session, workspace=workspace, gem_id=None)

    assert "START important setup context" in result.memory_block
    assert "CRITICAL_TAIL: final instruction" in result.memory_block
    assert TRUNCATION_MARKER in result.memory_block


def test_short_memory_remains_unchanged_when_clipped() -> None:
    service = MemoryInjectionService()
    text = "Short memory remains unchanged."

    assert service.clip_preview(text) == text
