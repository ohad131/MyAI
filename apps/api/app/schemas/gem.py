from datetime import datetime
import json
from typing import Any

from pydantic import Field
from pydantic import field_validator

from app.schemas.common import ORMModel

JSONContainer = dict[str, Any] | list[Any]


class GemBase(ORMModel):
    name: str = Field(min_length=1, max_length=128)
    system_prompt: str = Field(min_length=1)
    style_rules_json: JSONContainer | None = None
    think_default: bool = False
    allowed_models_json: list[str] | None = None
    is_global: bool = True
    workspace_id: str | None = None

    @field_validator("allowed_models_json")
    @classmethod
    def validate_allowed_models(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        if not value:
            return []
        for item in value:
            if not isinstance(item, str) or not item.strip():
                raise ValueError("allowed_models_json must contain non-empty model ids")
        return value

    @field_validator("style_rules_json", mode="before")
    @classmethod
    def parse_style_rules(cls, value: Any) -> JSONContainer | None:
        if value is None:
            return None
        if isinstance(value, str):
            loaded = json.loads(value)
            if isinstance(loaded, (dict, list)):
                return loaded
            raise ValueError("style_rules_json must decode to object or array")
        if isinstance(value, (dict, list)):
            return value
        raise ValueError("style_rules_json must be object or array")

    @field_validator("allowed_models_json", mode="before")
    @classmethod
    def parse_allowed_models(cls, value: Any) -> list[str] | None:
        if value is None:
            return None
        if isinstance(value, str):
            loaded = json.loads(value)
            if isinstance(loaded, list):
                return loaded
            raise ValueError("allowed_models_json must decode to array")
        return value


class GemCreate(GemBase):
    pass


class GemUpdate(ORMModel):
    name: str | None = Field(default=None, min_length=1, max_length=128)
    system_prompt: str | None = Field(default=None, min_length=1)
    style_rules_json: JSONContainer | None = None
    think_default: bool | None = None
    allowed_models_json: list[str] | None = None
    is_global: bool | None = None
    workspace_id: str | None = None

    @field_validator("allowed_models_json")
    @classmethod
    def validate_allowed_models(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        for item in value:
            if not isinstance(item, str) or not item.strip():
                raise ValueError("allowed_models_json must contain non-empty model ids")
        return value


class GemRead(GemBase):
    id: str
    created_at: datetime
    updated_at: datetime
