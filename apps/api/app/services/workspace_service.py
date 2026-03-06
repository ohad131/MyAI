from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repos.workspace_repo import WorkspaceRepo
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from app.services.audit_service import AuditService
from app.services.gem_service import GemService


class WorkspaceService:
    def __init__(
        self,
        repo: WorkspaceRepo | None = None,
        audit: AuditService | None = None,
        gem_service: GemService | None = None,
    ) -> None:
        self.repo = repo or WorkspaceRepo()
        self.audit = audit or AuditService()
        self.gem_service = gem_service or GemService()

    def list_workspaces(self, db: Session):
        return self.repo.list(db)

    def get_workspace_or_404(self, db: Session, workspace_id: str):
        workspace = self.repo.get(db, workspace_id)
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        return workspace

    def create_workspace(self, db: Session, payload: WorkspaceCreate):
        if payload.default_gem_id:
            gem = self.gem_service.get_gem_or_404(db, payload.default_gem_id)
            if not gem.is_global:
                raise HTTPException(
                    status_code=400,
                    detail="default_gem_id must be global during workspace creation",
                )
        workspace = self.repo.create(db, payload)
        self.audit.log_event(
            db,
            event_type="workspace_created",
            workspace_id=workspace.id,
            payload={"name": workspace.name},
        )
        return workspace

    def update_workspace(self, db: Session, workspace_id: str, payload: WorkspaceUpdate):
        workspace = self.get_workspace_or_404(db, workspace_id)
        if payload.default_gem_id:
            self.gem_service.ensure_workspace_access(db, payload.default_gem_id, workspace.id)
        workspace = self.repo.update(db, workspace, payload)
        self.audit.log_event(
            db,
            event_type="workspace_updated",
            workspace_id=workspace.id,
            payload=payload.model_dump(exclude_unset=True),
        )
        return workspace

    def delete_workspace(self, db: Session, workspace_id: str):
        workspace = self.get_workspace_or_404(db, workspace_id)
        self.repo.delete(db, workspace)
        self.audit.log_event(
            db,
            event_type="workspace_deleted",
            workspace_id=workspace_id,
            payload={"workspace_id": workspace_id},
        )
