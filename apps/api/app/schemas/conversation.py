from datetime import datetime
import json
from typing import Any, Literal

from pydantic import Field
from pydantic import field_validator

from app.core.config import settings
from app.schemas.common import ORMModel


class MessageRead(ORMModel):
    id: str
    conversation_id: str
    role: Literal["system", "user", "assistant"]
    content: str
    meta_json: dict[str, Any] | list[Any] | None
    created_at: datetime

    @field_validator("meta_json", mode="before")
    @classmethod
    def parse_meta_json(cls, value: Any) -> dict[str, Any] | list[Any] | None:
        if value is None:
            return None
        if isinstance(value, str):
            loaded = json.loads(value)
            if isinstance(loaded, (dict, list)):
                return loaded
            raise ValueError("meta_json must decode to object or array")
        if isinstance(value, (dict, list)):
            return value
        raise ValueError("meta_json must be object or array")


class ConversationBase(ORMModel):
    workspace_id: str
    title: str = Field(min_length=1, max_length=256)
    model: str = Field(default=settings.default_model, min_length=1, max_length=128)
    gem_id: str | None = None
    think_enabled: bool = False


class ConversationCreate(ConversationBase):
    pass


class ConversationUpdate(ORMModel):
    title: str | None = Field(default=None, min_length=1, max_length=256)
    model: str | None = Field(default=None, min_length=1, max_length=128)
    gem_id: str | None = None
    think_enabled: bool | None = None


class ConversationRead(ConversationBase):
    id: str
    created_at: datetime
    updated_at: datetime
