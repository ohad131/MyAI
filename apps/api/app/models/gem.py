from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import UUIDTimestampMixin


class Gem(UUIDTimestampMixin, Base):
    __tablename__ = "gems"

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    style_rules_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    think_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allowed_models_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_global: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    workspace_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True)

    workspace = relationship("Workspace", back_populates="gems")
