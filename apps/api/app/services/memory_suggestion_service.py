from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.memory_suggestion import MemorySuggestion
from app.repos.memory_repo import MemoryRepo
from app.repos.memory_suggestion_repo import MemorySuggestionRepo
from app.schemas.memory_enums import MemoryScope, MemorySuggestionStatus, MemoryType
from app.schemas.memory_suggestion import MemorySuggestionApprove, MemorySuggestionCreate
from app.services.audit_service import AuditService
from app.services.memory_service import MemoryService


class MemorySuggestionService:
    def __init__(
        self,
        repo: MemorySuggestionRepo | None = None,
        memory_repo: MemoryRepo | None = None,
        memory_service: MemoryService | None = None,
        audit: AuditService | None = None,
    ) -> None:
        self.repo = repo or MemorySuggestionRepo()
        self.memory_repo = memory_repo or MemoryRepo()
        self.memory_service = memory_service or MemoryService(repo=self.memory_repo)
        self.audit = audit or AuditService()

    def list_suggestions(
        self,
        db: Session,
        status: MemorySuggestionStatus | None = None,
        scope: MemoryScope | None = None,
        scope_id: str | None = None,
        type: MemoryType | None = None,
    ):
        return self.repo.list(
            db,
            status=status,
            scope=scope,
            scope_id=scope_id,
            type=type,
        )

    def get_suggestion_or_404(self, db: Session, suggestion_id: str) -> MemorySuggestion:
        suggestion = self.repo.get(db, suggestion_id)
        if not suggestion:
            raise HTTPException(status_code=404, detail="Memory suggestion not found")
        return suggestion

    def create_suggestion(self, db: Session, payload: MemorySuggestionCreate):
        self.memory_service.validate_scope_target(db, payload.scope, payload.scope_id)
        suggestion = self.repo.create(db, payload)
        self.audit.log_event(
            db,
            event_type="memory_suggestion_created",
            workspace_id=self.memory_service.workspace_id_for_audit(payload.scope, payload.scope_id),
            payload={
                "suggestion_id": suggestion.id,
                "scope": suggestion.scope,
                "scope_id": suggestion.scope_id,
                "type": suggestion.type,
            },
        )
        return suggestion

    def approve_suggestion(
        self,
        db: Session,
        suggestion_id: str,
        payload: MemorySuggestionApprove | None,
    ):
        suggestion = self.get_suggestion_or_404(db, suggestion_id)
        if suggestion.status != MemorySuggestionStatus.PENDING.value:
            raise HTTPException(status_code=400, detail="Only pending suggestions can be approved")

        scope = MemoryScope(suggestion.scope)
        type = MemoryType(suggestion.type)
        override_content = payload.content if payload else None
        content = override_content or suggestion.proposed_content
        self.memory_service.validate_scope_target(db, scope, suggestion.scope_id)

        memory = self.memory_repo.create_from_values(
            db,
            scope=scope,
            scope_id=suggestion.scope_id,
            type=type,
            content=content,
            commit=False,
        )
        self.repo.update_status(
            db,
            suggestion,
            MemorySuggestionStatus.APPROVED,
            commit=False,
        )
        db.commit()
        db.refresh(memory)
        db.refresh(suggestion)
        self.memory_service.index_memory_embedding_non_fatal(db, memory)

        self.audit.log_event(
            db,
            event_type="memory_suggestion_approved",
            workspace_id=self.memory_service.workspace_id_for_audit(scope, suggestion.scope_id),
            payload={
                "suggestion_id": suggestion.id,
                "memory_id": memory.id,
                "content_edited": override_content is not None,
            },
        )
        return {"suggestion": suggestion, "memory": memory}

    def reject_suggestion(self, db: Session, suggestion_id: str):
        suggestion = self.get_suggestion_or_404(db, suggestion_id)
        if suggestion.status != MemorySuggestionStatus.PENDING.value:
            raise HTTPException(status_code=400, detail="Only pending suggestions can be rejected")

        suggestion = self.repo.update_status(db, suggestion, MemorySuggestionStatus.REJECTED)
        self.audit.log_event(
            db,
            event_type="memory_suggestion_rejected",
            workspace_id=self.memory_service.workspace_id_for_audit(MemoryScope(suggestion.scope), suggestion.scope_id),
            payload={"suggestion_id": suggestion.id},
        )
        return suggestion
