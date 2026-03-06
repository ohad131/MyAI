from typing import Any

from sqlalchemy.orm import Session

from app.repos.audit_log_repo import AuditLogRepo


class AuditService:
    def __init__(self, repo: AuditLogRepo | None = None) -> None:
        self.repo = repo or AuditLogRepo()

    def log_event(
        self,
        db: Session,
        event_type: str,
        workspace_id: str | None = None,
        conversation_id: str | None = None,
        payload: dict[str, Any] | list[Any] | None = None,
    ) -> None:
        self.repo.create(
            db=db,
            event_type=event_type,
            workspace_id=workspace_id,
            conversation_id=conversation_id,
            payload_json=payload,
        )

    def list_logs(self, db: Session, limit: int = 200):
        return self.repo.list_logs(db=db, limit=limit)
