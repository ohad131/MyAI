from datetime import datetime
from typing import Any

from pydantic import Field
from pydantic import field_validator
from pydantic import model_validator

from app.schemas.common import ORMModel
from app.schemas.memory import MemoryRead
from app.schemas.memory import validate_scope_scope_id
from app.schemas.memory_enums import MemoryScope, MemorySuggestionStatus, MemoryType
from app.utils.json_codec import parse_json_text


class MemorySuggestionBase(ORMModel):
    source_conversation_id: str | None = None
    source_message_id: str | None = None
    scope: MemoryScope
    scope_id: str | None = None
    type: MemoryType
    proposed_content: str = Field(min_length=1)
    confidence: float | None = None
    reason: str | None = None
    candidate_signals_json: dict[str, Any] | list[Any] | None = None

    @model_validator(mode="after")
    def validate_scope_values(self):
        validate_scope_scope_id(self.scope, self.scope_id)
        return self

    @field_validator("candidate_signals_json", mode="before")
    @classmethod
    def parse_candidate_signals_json(cls, value):
        if value is None or isinstance(value, (dict, list)):
            return value
        if isinstance(value, str):
            parsed = parse_json_text(value)
            if parsed is None:
                return None
            return parsed
        raise ValueError("candidate_signals_json must be a JSON object or array")


class MemorySuggestionCreate(MemorySuggestionBase):
    pass


class MemorySuggestionRead(MemorySuggestionBase):
    id: str
    status: MemorySuggestionStatus
    created_at: datetime
    updated_at: datetime


class MemorySuggestionApprove(ORMModel):
    content: str | None = Field(default=None, min_length=1)


class MemorySuggestionApproveResult(ORMModel):
    suggestion: MemorySuggestionRead
    memory: MemoryRead
