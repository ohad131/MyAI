from datetime import datetime
import json
from typing import Any

from pydantic import field_validator
from app.schemas.common import ORMModel


class AuditLogRead(ORMModel):
    id: str
    event_type: str
    workspace_id: str | None
    conversation_id: str | None
    payload_json: dict[str, Any] | list[Any] | None
    created_at: datetime

    @field_validator("payload_json", mode="before")
    @classmethod
    def parse_payload_json(cls, value: Any) -> dict[str, Any] | list[Any] | None:
        if value is None:
            return None
        if isinstance(value, str):
            loaded = json.loads(value)
            if isinstance(loaded, (dict, list)):
                return loaded
            raise ValueError("payload_json must decode to object or array")
        if isinstance(value, (dict, list)):
            return value
        raise ValueError("payload_json must be object or array")
