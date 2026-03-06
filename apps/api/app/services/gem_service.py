from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repos.gem_repo import GemRepo
from app.repos.workspace_repo import WorkspaceRepo
from app.schemas.gem import GemCreate, GemUpdate
from app.services.audit_service import AuditService


class GemService:
    def __init__(
        self,
        repo: GemRepo | None = None,
        workspace_repo: WorkspaceRepo | None = None,
        audit: AuditService | None = None,
    ) -> None:
        self.repo = repo or GemRepo()
        self.workspace_repo = workspace_repo or WorkspaceRepo()
        self.audit = audit or AuditService()

    def list_gems(self, db: Session, workspace_id: str | None = None, include_global: bool = True):
        return self.repo.list(db, workspace_id=workspace_id, include_global=include_global)

    def get_gem_or_404(self, db: Session, gem_id: str):
        gem = self.repo.get(db, gem_id)
        if not gem:
            raise HTTPException(status_code=404, detail="Gem not found")
        return gem

    def ensure_workspace_access(self, db: Session, gem_id: str, workspace_id: str):
        gem = self.get_gem_or_404(db, gem_id)
        if gem.is_global or gem.workspace_id == workspace_id:
            return gem
        raise HTTPException(status_code=400, detail="Gem does not belong to this workspace")

    def create_gem(self, db: Session, payload: GemCreate):
        if payload.is_global and payload.workspace_id is not None:
            raise HTTPException(status_code=400, detail="Global gems cannot be scoped to a workspace")
        if not payload.is_global and payload.workspace_id is None:
            raise HTTPException(status_code=400, detail="Workspace-scoped gems require workspace_id")
        if not payload.is_global and payload.workspace_id and not self.workspace_repo.get(db, payload.workspace_id):
            raise HTTPException(status_code=400, detail="workspace_id does not exist")

        gem = self.repo.create(db, payload)
        self.audit.log_event(
            db,
            event_type="gem_created",
            workspace_id=gem.workspace_id,
            payload={"name": gem.name, "is_global": gem.is_global},
        )
        return gem

    def update_gem(self, db: Session, gem_id: str, payload: GemUpdate):
        gem = self.get_gem_or_404(db, gem_id)

        incoming = payload.model_dump(exclude_unset=True)
        is_global = incoming.get("is_global", gem.is_global)
        workspace_id = incoming.get("workspace_id", gem.workspace_id)
        if is_global and workspace_id is not None:
            raise HTTPException(status_code=400, detail="Global gems cannot be scoped to a workspace")
        if not is_global and workspace_id is None:
            raise HTTPException(status_code=400, detail="Workspace-scoped gems require workspace_id")
        if not is_global and workspace_id and not self.workspace_repo.get(db, workspace_id):
            raise HTTPException(status_code=400, detail="workspace_id does not exist")

        gem = self.repo.update(db, gem, payload)
        self.audit.log_event(
            db,
            event_type="gem_updated",
            workspace_id=gem.workspace_id,
            payload=incoming,
        )
        return gem

    def delete_gem(self, db: Session, gem_id: str):
        gem = self.get_gem_or_404(db, gem_id)
        workspace_id = gem.workspace_id
        self.repo.delete(db, gem)
        self.audit.log_event(
            db,
            event_type="gem_deleted",
            workspace_id=workspace_id,
            payload={"gem_id": gem_id},
        )
