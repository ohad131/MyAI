from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.db.base import Base
from app.models.mixins import UUIDTimestampMixin


class Workspace(UUIDTimestampMixin, Base):
    __tablename__ = "workspaces"

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(String(512), nullable=True)
    default_chat_model: Mapped[str] = mapped_column(String(128), nullable=False, default=settings.default_model)
    default_gem_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    default_language: Mapped[str] = mapped_column(String(2), nullable=False, default=settings.default_language)
    use_global_memory: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    global_memory_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="all")

    conversations = relationship("Conversation", back_populates="workspace", cascade="all, delete-orphan")
    gems = relationship("Gem", back_populates="workspace", cascade="all, delete-orphan")
