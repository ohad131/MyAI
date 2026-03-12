from datetime import datetime

from pydantic import Field
from pydantic import field_validator
from pydantic import model_validator

from app.schemas.common import ORMModel
from app.schemas.memory_enums import MemoryScope, MemoryType
from app.utils.json_codec import parse_json_text


def validate_scope_scope_id(scope: MemoryScope, scope_id: str | None) -> None:
    if scope == MemoryScope.GLOBAL and scope_id is not None:
        raise ValueError("scope_id must be omitted when scope is global")
    if scope in (MemoryScope.WORKSPACE, MemoryScope.GEM) and (scope_id is None or not scope_id.strip()):
        raise ValueError("scope_id is required when scope is workspace or gem")


class MemoryBase(ORMModel):
    scope: MemoryScope
    scope_id: str | None = None
    type: MemoryType
    content: str = Field(min_length=1)
    pinned: bool = False
    enabled: bool = True
    always_include: bool = False
    importance: float = 0.5
    confidence: float = 1.0
    source: str | None = None
    tags_json: list[str] | None = None
    last_used_at: datetime | None = None
    times_used: int = 0

    @model_validator(mode="after")
    def validate_scope_values(self):
        validate_scope_scope_id(self.scope, self.scope_id)
        return self

    @field_validator("tags_json", mode="before")
    @classmethod
    def validate_tags_json(cls, value):
        if value is None or isinstance(value, list):
            return value
        if isinstance(value, str):
            parsed = parse_json_text(value)
            if parsed is None:
                return None
            if not isinstance(parsed, list):
                raise ValueError("tags_json must be a JSON array of strings")
            if any(not isinstance(item, str) for item in parsed):
                raise ValueError("tags_json must be a JSON array of strings")
            return parsed
        raise ValueError("tags_json must be a list of strings")


class MemoryCreate(MemoryBase):
    pass


class MemoryUpdate(ORMModel):
    scope: MemoryScope | None = None
    scope_id: str | None = None
    type: MemoryType | None = None
    content: str | None = Field(default=None, min_length=1)
    pinned: bool | None = None
    enabled: bool | None = None
    always_include: bool | None = None
    importance: float | None = None
    confidence: float | None = None
    source: str | None = None
    tags_json: list[str] | None = None
    last_used_at: datetime | None = None
    times_used: int | None = None

    @field_validator("tags_json", mode="before")
    @classmethod
    def validate_tags_json(cls, value):
        if value is None or isinstance(value, list):
            return value
        if isinstance(value, str):
            parsed = parse_json_text(value)
            if parsed is None:
                return None
            if not isinstance(parsed, list):
                raise ValueError("tags_json must be a JSON array of strings")
            if any(not isinstance(item, str) for item in parsed):
                raise ValueError("tags_json must be a JSON array of strings")
            return parsed
        raise ValueError("tags_json must be a list of strings")


class MemoryRead(MemoryBase):
    id: str
    created_at: datetime
    updated_at: datetime
