from datetime import datetime

from pydantic import Field
from pydantic import model_validator

from app.schemas.common import ORMModel
from app.schemas.memory_enums import MemoryScope, MemoryType


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

    @model_validator(mode="after")
    def validate_scope_values(self):
        validate_scope_scope_id(self.scope, self.scope_id)
        return self


class MemoryCreate(MemoryBase):
    pass


class MemoryUpdate(ORMModel):
    scope: MemoryScope | None = None
    scope_id: str | None = None
    type: MemoryType | None = None
    content: str | None = Field(default=None, min_length=1)
    pinned: bool | None = None
    enabled: bool | None = None


class MemoryRead(MemoryBase):
    id: str
    created_at: datetime
    updated_at: datetime
