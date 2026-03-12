from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.memory_suggestion import MemorySuggestion
from app.schemas.memory_enums import MemoryScope, MemorySuggestionStatus, MemoryType
from app.schemas.memory_suggestion import MemorySuggestionCreate
from app.utils.json_codec import dump_json_text


class MemorySuggestionRepo:
    def list(
        self,
        db: Session,
        status: MemorySuggestionStatus | None = None,
        scope: MemoryScope | None = None,
        scope_id: str | None = None,
        type: MemoryType | None = None,
    ) -> list[MemorySuggestion]:
        stmt = select(MemorySuggestion).order_by(MemorySuggestion.created_at.desc())
        if status is not None:
            stmt = stmt.where(MemorySuggestion.status == status.value)
        if scope is not None:
            stmt = stmt.where(MemorySuggestion.scope == scope.value)
        if scope_id is not None:
            stmt = stmt.where(MemorySuggestion.scope_id == scope_id)
        if type is not None:
            stmt = stmt.where(MemorySuggestion.type == type.value)
        return list(db.scalars(stmt).all())

    def get(self, db: Session, suggestion_id: str) -> MemorySuggestion | None:
        return db.get(MemorySuggestion, suggestion_id)

    def create(self, db: Session, payload: MemorySuggestionCreate) -> MemorySuggestion:
        suggestion = MemorySuggestion(
            source_conversation_id=payload.source_conversation_id,
            source_message_id=payload.source_message_id,
            scope=payload.scope.value,
            scope_id=payload.scope_id,
            type=payload.type.value,
            proposed_content=payload.proposed_content,
            confidence=payload.confidence,
            reason=payload.reason,
            candidate_signals_json=dump_json_text(payload.candidate_signals_json),
            status=MemorySuggestionStatus.PENDING.value,
        )
        db.add(suggestion)
        db.commit()
        db.refresh(suggestion)
        return suggestion

    def update_status(
        self,
        db: Session,
        suggestion: MemorySuggestion,
        status: MemorySuggestionStatus,
        commit: bool = True,
    ) -> MemorySuggestion:
        suggestion.status = status.value
        db.add(suggestion)
        if commit:
            db.commit()
            db.refresh(suggestion)
        return suggestion
