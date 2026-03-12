from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.memory import Memory
from app.models.workspace import Workspace
from app.repos.memory_repo import MemoryRepo
from app.schemas.memory_enums import MemoryScope

MAX_SELECTED_MEMORIES = 8
MAX_PER_SCOPE: dict[str, int] = {
    MemoryScope.GLOBAL.value: 3,
    MemoryScope.WORKSPACE.value: 4,
    MemoryScope.GEM.value: 3,
}
MAX_MEMORY_CHARS = 240
SNIPPET_PREVIEW_CHARS = 140
TRUNCATION_MARKER = " ... [truncated] ... "


@dataclass
class MemorySelectionItem:
    memory: Memory
    rank_position: int
    why_shown: str


@dataclass
class MemorySelectionResult:
    items: list[MemorySelectionItem]
    memory_block: str
    caps: dict[str, int]


class MemoryInjectionService:
    def __init__(self, memory_repo: MemoryRepo | None = None) -> None:
        self.memory_repo = memory_repo or MemoryRepo()

    def select_for_chat(
        self,
        db: Session,
        workspace: Workspace,
        gem_id: str | None,
    ) -> list[Memory]:
        result = self.select_for_chat_with_explanations(db=db, workspace=workspace, gem_id=gem_id)
        return [item.memory for item in result.items]

    def select_for_chat_with_explanations(
        self,
        db: Session,
        workspace: Workspace,
        gem_id: str | None,
    ) -> MemorySelectionResult:
        candidates: list[Memory] = []

        workspace_memories = self.memory_repo.list(
            db,
            scope=MemoryScope.WORKSPACE,
            scope_id=workspace.id,
            enabled=True,
        )
        candidates.extend(workspace_memories)

        if gem_id:
            gem_memories = self.memory_repo.list(
                db,
                scope=MemoryScope.GEM,
                scope_id=gem_id,
                enabled=True,
            )
            candidates.extend(gem_memories)

        if workspace.use_global_memory:
            global_memories = self.memory_repo.list(
                db,
                scope=MemoryScope.GLOBAL,
                enabled=True,
            )
            if workspace.global_memory_mode == "pinned_only":
                global_memories = [memory for memory in global_memories if memory.pinned]
            candidates.extend(global_memories)

        scored = sorted(
            (memory for memory in candidates if self._is_valid_content(memory.content)),
            key=self._ranking_key,
        )

        selected: list[MemorySelectionItem] = []
        by_scope_count: dict[str, int] = {}
        for memory in scored:
            if len(selected) >= MAX_SELECTED_MEMORIES:
                break
            scope_count = by_scope_count.get(memory.scope, 0)
            if scope_count >= MAX_PER_SCOPE.get(memory.scope, MAX_SELECTED_MEMORIES):
                continue
            selected.append(
                MemorySelectionItem(
                    memory=memory,
                    rank_position=len(selected) + 1,
                    why_shown=self._why_shown(memory, workspace.global_memory_mode),
                )
            )
            by_scope_count[memory.scope] = scope_count + 1

        return MemorySelectionResult(
            items=selected,
            memory_block=self.build_prompt_block(selected),
            caps={
                "max_selected_memories": MAX_SELECTED_MEMORIES,
                "max_global": MAX_PER_SCOPE[MemoryScope.GLOBAL.value],
                "max_workspace": MAX_PER_SCOPE[MemoryScope.WORKSPACE.value],
                "max_gem": MAX_PER_SCOPE[MemoryScope.GEM.value],
                "max_memory_chars": MAX_MEMORY_CHARS,
            },
        )

    def build_prompt_block(self, items: list[MemorySelectionItem]) -> str:
        if not items:
            return ""

        lines: list[str] = [
            "Relevant saved memory:",
            "- Use these as background context when helpful.",
            "- If they conflict with the user's current explicit request, follow the current request.",
        ]

        for item in items:
            scope_label = self._scope_label(item.memory.scope)
            snippet = self._clip(item.memory.content.strip(), MAX_MEMORY_CHARS)
            lines.append(f"- [{scope_label}] {snippet}")

        return "\n".join(lines)

    def select_and_format_for_chat(
        self,
        db: Session,
        workspace: Workspace,
        gem_id: str | None,
    ) -> MemorySelectionResult:
        return self.select_for_chat_with_explanations(
            db=db,
            workspace=workspace,
            gem_id=gem_id,
        )

    def mark_memories_used(self, db: Session, memories: list[Memory]) -> None:
        if not memories:
            return
        now = datetime.now(UTC)
        for memory in memories:
            memory.last_used_at = now
            memory.times_used = (memory.times_used or 0) + 1
            db.add(memory)
        db.commit()

    def clip_preview(self, content: str) -> str:
        return self._clip(content.strip(), SNIPPET_PREVIEW_CHARS)

    @staticmethod
    def _is_valid_content(content: str) -> bool:
        return bool(content and content.strip())

    @staticmethod
    def _ranking_key(memory: Memory) -> tuple[object, ...]:
        recency = memory.last_used_at or memory.updated_at or memory.created_at
        recency_ts = recency.timestamp() if recency is not None else 0.0
        return (
            0 if memory.always_include else 1,
            0 if memory.pinned else 1,
            -(memory.importance or 0.0),
            -recency_ts,
            memory.created_at.isoformat() if memory.created_at else "",
            memory.id,
        )

    @staticmethod
    def _scope_label(scope: str) -> str:
        if scope == MemoryScope.GLOBAL.value:
            return "Global"
        if scope == MemoryScope.WORKSPACE.value:
            return "Workspace"
        if scope == MemoryScope.GEM.value:
            return "Gem"
        return "Memory"

    @staticmethod
    def _why_shown(memory: Memory, global_memory_mode: str) -> str:
        reasons: list[str] = []
        if memory.always_include:
            reasons.append("always_include")
        if memory.pinned:
            reasons.append("pinned")
        if (memory.importance or 0.0) >= 0.8:
            reasons.append("high_importance")
        if memory.scope == MemoryScope.WORKSPACE.value:
            reasons.append("scope:workspace")
        elif memory.scope == MemoryScope.GEM.value:
            reasons.append("scope:gem")
        elif memory.scope == MemoryScope.GLOBAL.value:
            if global_memory_mode == "pinned_only":
                reasons.append("scope:global:pinned_only_mode")
            else:
                reasons.append("scope:global")
        return "|".join(reasons)

    @staticmethod
    def _clip(text: str, max_chars: int) -> str:
        if len(text) <= max_chars:
            return text
        if max_chars <= len(TRUNCATION_MARKER) + 2:
            return text[:max_chars]

        available = max_chars - len(TRUNCATION_MARKER)
        head_len = max(1, int(available * 0.6))
        tail_len = max(1, available - head_len)

        head = text[:head_len].rstrip()
        tail = text[-tail_len:].lstrip()

        head = MemoryInjectionService._trim_end_to_word(head) or head
        tail = MemoryInjectionService._trim_start_to_word(tail) or tail
        return f"{head}{TRUNCATION_MARKER}{tail}"

    @staticmethod
    def _trim_end_to_word(text: str) -> str:
        if " " not in text:
            return text
        return text.rsplit(" ", 1)[0].rstrip()

    @staticmethod
    def _trim_start_to_word(text: str) -> str:
        if " " not in text:
            return text
        return text.split(" ", 1)[-1].lstrip()
