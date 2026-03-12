from sqlalchemy import CheckConstraint, Float, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import UUIDTimestampMixin


class MemorySuggestion(UUIDTimestampMixin, Base):
    __tablename__ = "memory_suggestions"
    __table_args__ = (
        CheckConstraint("scope IN ('global', 'workspace', 'gem')", name="ck_memory_suggestions_scope"),
        CheckConstraint("type IN ('fact', 'preference', 'instruction')", name="ck_memory_suggestions_type"),
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="ck_memory_suggestions_status"),
        CheckConstraint(
            "(scope = 'global' AND scope_id IS NULL) OR (scope IN ('workspace', 'gem') AND scope_id IS NOT NULL)",
            name="ck_memory_suggestions_scope_id_consistency",
        ),
        Index("ix_memory_suggestions_status", "status"),
        Index("ix_memory_suggestions_scope_scope_id", "scope", "scope_id"),
    )

    source_conversation_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    source_message_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    scope: Mapped[str] = mapped_column(String(16), nullable=False)
    scope_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    type: Mapped[str] = mapped_column(String(16), nullable=False)
    proposed_content: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    candidate_signals_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
