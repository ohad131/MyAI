from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate


class WorkspaceRepo:
    def list(self, db: Session) -> list[Workspace]:
        return list(db.scalars(select(Workspace).order_by(Workspace.created_at.desc())).all())

    def get(self, db: Session, workspace_id: str) -> Workspace | None:
        return db.get(Workspace, workspace_id)

    def create(self, db: Session, payload: WorkspaceCreate) -> Workspace:
        workspace = Workspace(**payload.model_dump())
        db.add(workspace)
        db.commit()
        db.refresh(workspace)
        return workspace

    def update(self, db: Session, workspace: Workspace, payload: WorkspaceUpdate) -> Workspace:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(workspace, field, value)
        db.add(workspace)
        db.commit()
        db.refresh(workspace)
        return workspace

    def delete(self, db: Session, workspace: Workspace) -> None:
        db.delete(workspace)
        db.commit()
