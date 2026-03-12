from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Float, Index, Integer, String, Text
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
    always_include: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    importance: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tags_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    times_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
