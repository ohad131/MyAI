from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.repos.conversation_repo import ConversationRepo
from app.repos.message_repo import MessageRepo
from app.schemas.conversation import ConversationCreate, ConversationUpdate
from app.services.audit_service import AuditService
from app.services.gem_service import GemService
from app.services.workspace_service import WorkspaceService


class ConversationService:
    def __init__(
        self,
        conversation_repo: ConversationRepo | None = None,
        message_repo: MessageRepo | None = None,
        workspace_service: WorkspaceService | None = None,
        gem_service: GemService | None = None,
        audit: AuditService | None = None,
    ) -> None:
        self.conversation_repo = conversation_repo or ConversationRepo()
        self.message_repo = message_repo or MessageRepo()
        self.workspace_service = workspace_service or WorkspaceService()
        self.gem_service = gem_service or GemService()
        self.audit = audit or AuditService()

    def list_conversations(self, db: Session, workspace_id: str):
        self.workspace_service.get_workspace_or_404(db, workspace_id)
        return self.conversation_repo.list_by_workspace(db, workspace_id)

    def get_conversation_or_404(self, db: Session, conversation_id: str) -> Conversation:
        conversation = self.conversation_repo.get(db, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation

    def create_conversation(self, db: Session, payload: ConversationCreate):
        workspace = self.workspace_service.get_workspace_or_404(db, payload.workspace_id)
        if payload.gem_id:
            self.gem_service.ensure_workspace_access(db, payload.gem_id, workspace.id)
        conversation = self.conversation_repo.create(db, payload)
        self.audit.log_event(
            db,
            event_type="conversation_created",
            workspace_id=conversation.workspace_id,
            conversation_id=conversation.id,
            payload={"title": conversation.title, "model": conversation.model},
        )
        return conversation

    def update_conversation(self, db: Session, conversation_id: str, payload: ConversationUpdate):
        conversation = self.get_conversation_or_404(db, conversation_id)
        if payload.gem_id:
            self.gem_service.ensure_workspace_access(db, payload.gem_id, conversation.workspace_id)
        conversation = self.conversation_repo.update(db, conversation, payload)
        self.audit.log_event(
            db,
            event_type="conversation_updated",
            workspace_id=conversation.workspace_id,
            conversation_id=conversation.id,
            payload=payload.model_dump(exclude_unset=True),
        )
        return conversation

    def delete_conversation(self, db: Session, conversation_id: str):
        conversation = self.get_conversation_or_404(db, conversation_id)
        self.conversation_repo.delete(db, conversation)
        self.audit.log_event(
            db,
            event_type="conversation_deleted",
            workspace_id=conversation.workspace_id,
            conversation_id=conversation_id,
            payload={"conversation_id": conversation_id},
        )

    def list_messages(self, db: Session, conversation_id: str):
        self.get_conversation_or_404(db, conversation_id)
        return self.message_repo.list_by_conversation(db, conversation_id)
