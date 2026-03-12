from sqlalchemy.orm import Session

from app.repos.memory_usage_log_repo import MemoryUsageLogRepo
from app.services.memory_injection_service import MemoryInjectionService, MemorySelectionItem


class MemoryUsageLogService:
    def __init__(
        self,
        repo: MemoryUsageLogRepo | None = None,
        memory_injection: MemoryInjectionService | None = None,
    ) -> None:
        self.repo = repo or MemoryUsageLogRepo()
        self.memory_injection = memory_injection or MemoryInjectionService()

    def log_injected_memories(
        self,
        db: Session,
        *,
        conversation_id: str | None,
        message_id: str | None,
        workspace_id: str | None,
        gem_id: str | None,
        items: list[MemorySelectionItem],
        failure_reason: str | None = None,
    ) -> None:
        if not items and failure_reason is None:
            return

        rows = []
        for item in items:
            rows.append(
                {
                    "conversation_id": conversation_id,
                    "message_id": message_id,
                    "workspace_id": workspace_id,
                    "gem_id": gem_id,
                    "memory_id": item.memory.id,
                    "memory_scope": item.memory.scope,
                    "selected": True,
                    "injected": True,
                    "rank_position": item.rank_position,
                    "why_shown": item.why_shown,
                    "snippet_preview": self.memory_injection.clip_preview(item.memory.content),
                    "failure_reason": failure_reason,
                }
            )

        if failure_reason and not rows:
            rows.append(
                {
                    "conversation_id": conversation_id,
                    "message_id": message_id,
                    "workspace_id": workspace_id,
                    "gem_id": gem_id,
                    "memory_id": None,
                    "memory_scope": None,
                    "selected": False,
                    "injected": False,
                    "rank_position": None,
                    "why_shown": None,
                    "snippet_preview": None,
                    "failure_reason": failure_reason,
                }
            )

        self.repo.create_many(db, rows)

    def list_logs(
        self,
        db: Session,
        *,
        conversation_id: str | None = None,
        workspace_id: str | None = None,
        injected_only: bool = False,
        limit: int = 200,
    ):
        return self.repo.list_logs(
            db,
            conversation_id=conversation_id,
            workspace_id=workspace_id,
            injected_only=injected_only,
            limit=limit,
        )
