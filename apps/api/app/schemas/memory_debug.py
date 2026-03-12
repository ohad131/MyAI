from datetime import datetime

from pydantic import Field

from app.schemas.common import ORMModel
from app.schemas.memory import MemoryRead


class MemoryUsageLogRead(ORMModel):
    id: str
    created_at: datetime
    conversation_id: str | None
    message_id: str | None
    workspace_id: str | None
    gem_id: str | None
    memory_id: str | None
    memory_scope: str | None
    selected: bool
    injected: bool
    rank_position: int | None
    why_shown: str | None
    snippet_preview: str | None
    failure_reason: str | None


class MemoryRetrievePreviewRequest(ORMModel):
    workspace_id: str
    gem_id: str | None = None
    conversation_id: str | None = None
    user_message: str | None = Field(default=None, min_length=1)
    query_text: str | None = Field(default=None, min_length=1)


class MemoryPreviewItem(ORMModel):
    memory: MemoryRead
    rank_position: int
    why_shown: str


class MemoryRetrievePreviewResponse(ORMModel):
    selected_memories: list[MemoryPreviewItem]
    memory_block: str
    caps: dict[str, int]


class MemoryEmbeddingRebuildResponse(ORMModel):
    processed: int
    created: int
    updated: int
    skipped: int
    failed: int
