from datetime import datetime
from typing import Literal

from pydantic import Field

from app.core.config import settings
from app.schemas.common import ORMModel


class WorkspaceBase(ORMModel):
    name: str = Field(min_length=1, max_length=128)
    description: str | None = Field(default=None, max_length=512)
    default_chat_model: str = Field(default=settings.default_model, min_length=1, max_length=128)
    default_gem_id: str | None = None
    default_language: Literal["he", "en"] = "he"
    use_global_memory: bool = False
    global_memory_mode: Literal["all", "pinned_only"] = "all"


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(ORMModel):
    name: str | None = Field(default=None, min_length=1, max_length=128)
    description: str | None = Field(default=None, max_length=512)
    default_chat_model: str | None = Field(default=None, min_length=1, max_length=128)
    default_gem_id: str | None = None
    default_language: Literal["he", "en"] | None = None
    use_global_memory: bool | None = None
    global_memory_mode: Literal["all", "pinned_only"] | None = None


class WorkspaceRead(WorkspaceBase):
    id: str
    created_at: datetime
    updated_at: datetime
