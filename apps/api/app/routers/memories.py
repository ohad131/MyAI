from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.memory import MemoryCreate, MemoryRead, MemoryUpdate
from app.schemas.memory_enums import MemoryScope, MemoryType
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/memories", tags=["memories"])
service = MemoryService()


@router.get("", response_model=list[MemoryRead])
def list_memories(
    scope: MemoryScope | None = Query(default=None),
    scope_id: str | None = Query(default=None),
    type: MemoryType | None = Query(default=None),
    pinned: bool | None = Query(default=None),
    enabled: bool | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[MemoryRead]:
    return service.list_memories(
        db,
        scope=scope,
        scope_id=scope_id,
        type=type,
        pinned=pinned,
        enabled=enabled,
    )


@router.post("", response_model=MemoryRead, status_code=status.HTTP_201_CREATED)
def create_memory(payload: MemoryCreate, db: Session = Depends(get_db)) -> MemoryRead:
    return service.create_memory(db, payload)


@router.patch("/{memory_id}", response_model=MemoryRead)
def update_memory(memory_id: str, payload: MemoryUpdate, db: Session = Depends(get_db)) -> MemoryRead:
    return service.update_memory(db, memory_id, payload)


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(memory_id: str, db: Session = Depends(get_db)) -> Response:
    service.delete_memory(db, memory_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
