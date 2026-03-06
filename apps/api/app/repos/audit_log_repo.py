from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.utils.json_codec import dump_json_text


class AuditLogRepo:
    def list_logs(self, db: Session, limit: int = 200) -> list[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        return list(db.scalars(stmt).all())

    def create(
        self,
        db: Session,
        event_type: str,
        workspace_id: str | None,
        conversation_id: str | None,
        payload_json: dict[str, Any] | list[Any] | None,
    ) -> AuditLog:
        log = AuditLog(
            event_type=event_type,
            workspace_id=workspace_id,
            conversation_id=conversation_id,
            payload_json=dump_json_text(payload_json),
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
