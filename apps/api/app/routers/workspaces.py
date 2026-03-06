from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.workspace import WorkspaceCreate, WorkspaceRead, WorkspaceUpdate
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["workspaces"])
service = WorkspaceService()


@router.get("", response_model=list[WorkspaceRead])
def list_workspaces(db: Session = Depends(get_db)) -> list[WorkspaceRead]:
    return service.list_workspaces(db)


@router.post("", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
def create_workspace(payload: WorkspaceCreate, db: Session = Depends(get_db)) -> WorkspaceRead:
    return service.create_workspace(db, payload)


@router.get("/{workspace_id}", response_model=WorkspaceRead)
def get_workspace(workspace_id: str, db: Session = Depends(get_db)) -> WorkspaceRead:
    return service.get_workspace_or_404(db, workspace_id)


@router.patch("/{workspace_id}", response_model=WorkspaceRead)
def update_workspace(workspace_id: str, payload: WorkspaceUpdate, db: Session = Depends(get_db)) -> WorkspaceRead:
    return service.update_workspace(db, workspace_id, payload)


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace_id: str, db: Session = Depends(get_db)) -> Response:
    service.delete_workspace(db, workspace_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
