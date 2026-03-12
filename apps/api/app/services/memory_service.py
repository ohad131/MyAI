from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.memory import Memory
from app.repos.gem_repo import GemRepo
from app.repos.memory_repo import MemoryRepo
from app.repos.workspace_repo import WorkspaceRepo
from app.schemas.memory import MemoryCreate, MemoryUpdate, validate_scope_scope_id
from app.schemas.memory_enums import MemoryScope, MemoryType
from app.services.audit_service import AuditService


class MemoryService:
    def __init__(
        self,
        repo: MemoryRepo | None = None,
        workspace_repo: WorkspaceRepo | None = None,
        gem_repo: GemRepo | None = None,
        audit: AuditService | None = None,
    ) -> None:
        self.repo = repo or MemoryRepo()
        self.workspace_repo = workspace_repo or WorkspaceRepo()
        self.gem_repo = gem_repo or GemRepo()
        self.audit = audit or AuditService()

    def list_memories(
        self,
        db: Session,
        scope: MemoryScope | None = None,
        scope_id: str | None = None,
        type: MemoryType | None = None,
        pinned: bool | None = None,
        enabled: bool | None = None,
    ):
        return self.repo.list(
            db,
            scope=scope,
            scope_id=scope_id,
            type=type,
            pinned=pinned,
            enabled=enabled,
        )

    def get_memory_or_404(self, db: Session, memory_id: str) -> Memory:
        memory = self.repo.get(db, memory_id)
        if not memory:
            raise HTTPException(status_code=404, detail="Memory not found")
        return memory

    def create_memory(self, db: Session, payload: MemoryCreate):
        self.validate_scope_target(db, payload.scope, payload.scope_id)
        memory = self.repo.create(db, payload)
        self.audit.log_event(
            db,
            event_type="memory_created",
            workspace_id=self.workspace_id_for_audit(payload.scope, payload.scope_id),
            payload={
                "memory_id": memory.id,
                "scope": memory.scope,
                "scope_id": memory.scope_id,
                "type": memory.type,
            },
        )
        return memory

    def update_memory(self, db: Session, memory_id: str, payload: MemoryUpdate):
        memory = self.get_memory_or_404(db, memory_id)
        incoming = payload.model_dump(exclude_unset=True)

        if incoming.get("scope") == MemoryScope.GLOBAL and "scope_id" not in incoming:
            incoming["scope_id"] = None

        scope = incoming.get("scope", MemoryScope(memory.scope))
        scope_id = incoming.get("scope_id", memory.scope_id)

        self.validate_scope_target(db, scope, scope_id)
        memory = self.repo.update_fields(db, memory, incoming)
        self.audit.log_event(
            db,
            event_type="memory_updated",
            workspace_id=self.workspace_id_for_audit(MemoryScope(memory.scope), memory.scope_id),
            payload={"memory_id": memory.id, "changes": self._serialize_changes(incoming)},
        )
        return memory

    def delete_memory(self, db: Session, memory_id: str):
        memory = self.get_memory_or_404(db, memory_id)
        self.repo.delete(db, memory)
        self.audit.log_event(
            db,
            event_type="memory_deleted",
            workspace_id=self.workspace_id_for_audit(MemoryScope(memory.scope), memory.scope_id),
            payload={"memory_id": memory_id},
        )

    def validate_scope_target(self, db: Session, scope: MemoryScope, scope_id: str | None) -> None:
        try:
            validate_scope_scope_id(scope, scope_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        if scope == MemoryScope.WORKSPACE and scope_id and not self.workspace_repo.get(db, scope_id):
            raise HTTPException(status_code=400, detail="scope_id does not reference an existing workspace")
        if scope == MemoryScope.GEM and scope_id and not self.gem_repo.get(db, scope_id):
            raise HTTPException(status_code=400, detail="scope_id does not reference an existing gem")

    @staticmethod
    def workspace_id_for_audit(scope: MemoryScope, scope_id: str | None) -> str | None:
        if scope == MemoryScope.WORKSPACE:
            return scope_id
        return None

    @staticmethod
    def _serialize_changes(changes: dict[str, object]) -> dict[str, object]:
        serialized: dict[str, object] = {}
        for key, value in changes.items():
            if isinstance(value, (MemoryScope, MemoryType)):
                serialized[key] = value.value
            else:
                serialized[key] = value
        return serialized
