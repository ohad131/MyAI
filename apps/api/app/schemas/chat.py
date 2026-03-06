from pydantic import Field

from app.core.config import settings
from app.schemas.common import ORMModel


class ChatRequest(ORMModel):
    workspace_id: str
    conversation_id: str
    user_message: str = Field(min_length=1)
    selected_model: str | None = Field(default=None, min_length=1, max_length=128)
    selected_gem_id: str | None = None
    think: bool | None = None


class ChatResponse(ORMModel):
    conversation_id: str
    assistant_message_id: str
    assistant_message: str
    model: str = settings.default_model
    gem_id: str | None = None
    think: bool = False
    provider: str
