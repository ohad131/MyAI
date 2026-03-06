import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.providers.registry import ProviderRegistry
from app.repos.gem_repo import GemRepo
from app.repos.message_repo import MessageRepo
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.audit_service import AuditService
from app.services.conversation_service import ConversationService
from app.services.gem_service import GemService
from app.services.workspace_service import WorkspaceService
from app.services.prompt_builder import build_prompt_messages
from app.utils.json_codec import parse_json_text

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(
        self,
        registry: ProviderRegistry | None = None,
        conversation_service: ConversationService | None = None,
        message_repo: MessageRepo | None = None,
        gem_repo: GemRepo | None = None,
        workspace_service: WorkspaceService | None = None,
        gem_service: GemService | None = None,
        audit: AuditService | None = None,
    ) -> None:
        self.registry = registry or ProviderRegistry()
        self.conversation_service = conversation_service or ConversationService()
        self.message_repo = message_repo or MessageRepo()
        self.gem_repo = gem_repo or GemRepo()
        self.workspace_service = workspace_service or WorkspaceService()
        self.gem_service = gem_service or GemService()
        self.audit = audit or AuditService()

    async def execute_chat(self, db: Session, payload: ChatRequest) -> ChatResponse:
        conversation = self.conversation_service.get_conversation_or_404(db, payload.conversation_id)
        if conversation.workspace_id != payload.workspace_id:
            raise HTTPException(status_code=400, detail="Conversation does not belong to workspace")
        workspace = self.workspace_service.get_workspace_or_404(db, payload.workspace_id)

        model = payload.selected_model or conversation.model or settings.default_model
        think = payload.think if payload.think is not None else (conversation.think_enabled or False)

        gem_id = payload.selected_gem_id or conversation.gem_id or workspace.default_gem_id
        gem = self.gem_repo.get(db, gem_id) if gem_id else None
        if gem_id and gem is None:
            raise HTTPException(status_code=400, detail="Selected gem not found")
        if gem:
            self.gem_service.ensure_workspace_access(db, gem.id, conversation.workspace_id)

        if gem and gem.allowed_models_json:
            try:
                allowed_models = parse_json_text(gem.allowed_models_json)
                if not isinstance(allowed_models, list):
                    raise HTTPException(status_code=400, detail="Gem allowed_models_json must be a JSON array")
                if model not in allowed_models:
                    raise HTTPException(status_code=400, detail="Model is not allowed for selected gem")
            except ValueError:
                raise HTTPException(status_code=400, detail="Gem allowed_models_json is invalid JSON")

        history = self.message_repo.list_by_conversation(db, conversation.id)
        prompt_messages = build_prompt_messages(
            history=history,
            current_user_message=payload.user_message,
            gem=gem,
        )

        user_message = self.message_repo.create(
            db,
            conversation_id=conversation.id,
            role="user",
            content=payload.user_message,
            meta_json={"source": "chat_endpoint"},
        )

        provider = self.registry.default()
        try:
            result = await provider.chat(model=model, messages=prompt_messages, think=think)
            assistant_text = result.get("content", "")

            assistant_message = self.message_repo.create(
                db,
                conversation_id=conversation.id,
                role="assistant",
                content=assistant_text,
                meta_json={"provider": provider.provider_name, "model": model, "think": think},
            )

            self.conversation_service.conversation_repo.persist_chat_state(
                db=db,
                conversation_id=conversation.id,
                model=model,
                gem_id=gem_id,
                think_enabled=think,
            )

            self.audit.log_event(
                db,
                event_type="chat_completed",
                workspace_id=conversation.workspace_id,
                conversation_id=conversation.id,
                payload={
                    "provider": provider.provider_name,
                    "model": model,
                    "gem_id": gem_id,
                    "think": think,
                    "user_message_id": user_message.id,
                    "assistant_message_id": assistant_message.id,
                },
            )

            logger.info("chat completed conversation_id=%s model=%s", conversation.id, model)
            return ChatResponse(
                conversation_id=conversation.id,
                assistant_message_id=assistant_message.id,
                assistant_message=assistant_text,
                model=model,
                gem_id=gem_id,
                think=think,
                provider=provider.provider_name,
            )
        except Exception as exc:
            self.audit.log_event(
                db,
                event_type="chat_failed",
                workspace_id=conversation.workspace_id,
                conversation_id=conversation.id,
                payload={
                    "provider": provider.provider_name,
                    "model": model,
                    "gem_id": gem_id,
                    "think": think,
                    "error": str(exc),
                },
            )
            logger.exception("chat failed conversation_id=%s", conversation.id)
            raise HTTPException(status_code=502, detail=f"Chat provider failure: {exc}") from exc
