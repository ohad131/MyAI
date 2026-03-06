from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.db.base import Base
from app.models.mixins import UUIDTimestampMixin


class Conversation(UUIDTimestampMixin, Base):
    __tablename__ = "conversations"

    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    model: Mapped[str] = mapped_column(String(128), nullable=False, default=settings.default_model)
    gem_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("gems.id", ondelete="SET NULL"), nullable=True)
    think_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    workspace = relationship("Workspace", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    gem = relationship("Gem")
