from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.schemas.conversation import ConversationCreate, ConversationUpdate


class ConversationRepo:
    def list_by_workspace(self, db: Session, workspace_id: str) -> list[Conversation]:
        stmt = select(Conversation).where(Conversation.workspace_id == workspace_id).order_by(Conversation.updated_at.desc())
        return list(db.scalars(stmt).all())

    def get(self, db: Session, conversation_id: str) -> Conversation | None:
        return db.get(Conversation, conversation_id)

    def create(self, db: Session, payload: ConversationCreate) -> Conversation:
        conversation = Conversation(**payload.model_dump())
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation

    def update(self, db: Session, conversation: Conversation, payload: ConversationUpdate) -> Conversation:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(conversation, field, value)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation

    def delete(self, db: Session, conversation: Conversation) -> None:
        db.delete(conversation)
        db.commit()

    def persist_chat_state(
        self,
        db: Session,
        conversation_id: str,
        model: str,
        gem_id: str | None,
        think_enabled: bool,
    ) -> Conversation:
        stmt = (
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(
                model=model,
                gem_id=gem_id,
                think_enabled=think_enabled,
                updated_at=func.now(),
            )
        )
        db.execute(stmt)
        db.commit()
        refreshed = db.get(Conversation, conversation_id)
        if refreshed is None:
            raise ValueError("Conversation disappeared during state persistence")
        return refreshed
