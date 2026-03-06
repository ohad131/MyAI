from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.message import Message
from app.utils.json_codec import dump_json_text


class MessageRepo:
    def list_by_conversation(self, db: Session, conversation_id: str) -> list[Message]:
        stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
        return list(db.scalars(stmt).all())

    def create(
        self,
        db: Session,
        conversation_id: str,
        role: str,
        content: str,
        meta_json: dict[str, Any] | list[Any] | None = None,
    ) -> Message:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            meta_json=dump_json_text(meta_json),
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message
