from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.gem import GemCreate, GemRead, GemUpdate
from app.services.gem_service import GemService

router = APIRouter(prefix="/gems", tags=["gems"])
service = GemService()


@router.get("", response_model=list[GemRead])
def list_gems(
    workspace_id: str | None = Query(default=None),
    include_global: bool = Query(default=True),
    db: Session = Depends(get_db),
) -> list[GemRead]:
    return service.list_gems(db, workspace_id=workspace_id, include_global=include_global)


@router.post("", response_model=GemRead, status_code=status.HTTP_201_CREATED)
def create_gem(payload: GemCreate, db: Session = Depends(get_db)) -> GemRead:
    return service.create_gem(db, payload)


@router.get("/{gem_id}", response_model=GemRead)
def get_gem(gem_id: str, db: Session = Depends(get_db)) -> GemRead:
    return service.get_gem_or_404(db, gem_id)


@router.patch("/{gem_id}", response_model=GemRead)
def update_gem(gem_id: str, payload: GemUpdate, db: Session = Depends(get_db)) -> GemRead:
    return service.update_gem(db, gem_id, payload)


@router.delete("/{gem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gem(gem_id: str, db: Session = Depends(get_db)) -> Response:
    service.delete_gem(db, gem_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
