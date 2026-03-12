from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.memory_usage_log import MemoryUsageLog


class MemoryUsageLogRepo:
    def create_many(self, db: Session, rows: list[dict[str, Any]], commit: bool = True) -> list[MemoryUsageLog]:
        logs = [MemoryUsageLog(**row) for row in rows]
        db.add_all(logs)
        if commit:
            db.commit()
            for log in logs:
                db.refresh(log)
        return logs

    def list_logs(
        self,
        db: Session,
        *,
        conversation_id: str | None = None,
        workspace_id: str | None = None,
        injected_only: bool = False,
        limit: int = 200,
    ) -> list[MemoryUsageLog]:
        stmt = select(MemoryUsageLog).order_by(MemoryUsageLog.created_at.desc())
        if conversation_id:
            stmt = stmt.where(MemoryUsageLog.conversation_id == conversation_id)
        if workspace_id:
            stmt = stmt.where(MemoryUsageLog.workspace_id == workspace_id)
        if injected_only:
            stmt = stmt.where(MemoryUsageLog.injected.is_(True))
        stmt = stmt.limit(limit)
        return list(db.scalars(stmt).all())
