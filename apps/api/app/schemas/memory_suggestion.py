from datetime import datetime

from pydantic import Field
from pydantic import model_validator

from app.schemas.common import ORMModel
from app.schemas.memory import MemoryRead
from app.schemas.memory import validate_scope_scope_id
from app.schemas.memory_enums import MemoryScope, MemorySuggestionStatus, MemoryType


class MemorySuggestionBase(ORMModel):
    source_conversation_id: str | None = None
    scope: MemoryScope
    scope_id: str | None = None
    type: MemoryType
    proposed_content: str = Field(min_length=1)

    @model_validator(mode="after")
    def validate_scope_values(self):
        validate_scope_scope_id(self.scope, self.scope_id)
        return self


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
