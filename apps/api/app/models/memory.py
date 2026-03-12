from sqlalchemy import Boolean, CheckConstraint, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import UUIDTimestampMixin


class Memory(UUIDTimestampMixin, Base):
    __tablename__ = "memories"
    __table_args__ = (
        CheckConstraint("scope IN ('global', 'workspace', 'gem')", name="ck_memories_scope"),
        CheckConstraint("type IN ('fact', 'preference', 'instruction')", name="ck_memories_type"),
        CheckConstraint(
            "(scope = 'global' AND scope_id IS NULL) OR (scope IN ('workspace', 'gem') AND scope_id IS NOT NULL)",
            name="ck_memories_scope_id_consistency",
        ),
        Index("ix_memories_scope_scope_id", "scope", "scope_id"),
        Index("ix_memories_type_enabled", "type", "enabled"),
    )

    scope: Mapped[str] = mapped_column(String(16), nullable=False)
    scope_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    type: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    pinned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
