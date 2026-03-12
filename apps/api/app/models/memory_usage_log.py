from datetime import datetime
import uuid

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MemoryUsageLog(Base):
    __tablename__ = "memory_usage_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    conversation_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    message_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    workspace_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    gem_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    memory_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    memory_scope: Mapped[str | None] = mapped_column(String(16), nullable=True)

    selected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    injected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    rank_position: Mapped[int | None] = mapped_column(Integer, nullable=True)

    why_shown: Mapped[str | None] = mapped_column(String(255), nullable=True)
    snippet_preview: Mapped[str | None] = mapped_column(String(255), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
