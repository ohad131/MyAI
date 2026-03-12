from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.memory_enums import MemoryScope, MemorySuggestionStatus, MemoryType
from app.schemas.memory_suggestion import (
    MemorySuggestionApprove,
    MemorySuggestionApproveResult,
    MemorySuggestionCreate,
    MemorySuggestionRead,
)
from app.services.memory_suggestion_service import MemorySuggestionService

router = APIRouter(prefix="/memory/suggestions", tags=["memory-suggestions"])
service = MemorySuggestionService()


@router.get("", response_model=list[MemorySuggestionRead])
def list_memory_suggestions(
    status_filter: MemorySuggestionStatus | None = Query(default=None, alias="status"),
    scope: MemoryScope | None = Query(default=None),
    scope_id: str | None = Query(default=None),
    type: MemoryType | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[MemorySuggestionRead]:
    return service.list_suggestions(
        db,
        status=status_filter,
        scope=scope,
        scope_id=scope_id,
        type=type,
    )


@router.post("", response_model=MemorySuggestionRead, status_code=status.HTTP_201_CREATED)
def create_memory_suggestion(payload: MemorySuggestionCreate, db: Session = Depends(get_db)) -> MemorySuggestionRead:
    return service.create_suggestion(db, payload)


@router.post("/{suggestion_id}/approve", response_model=MemorySuggestionApproveResult)
def approve_memory_suggestion(
    suggestion_id: str,
    payload: MemorySuggestionApprove | None = None,
    db: Session = Depends(get_db),
) -> MemorySuggestionApproveResult:
    return service.approve_suggestion(db, suggestion_id, payload)


@router.post("/{suggestion_id}/reject", response_model=MemorySuggestionRead)
def reject_memory_suggestion(suggestion_id: str, db: Session = Depends(get_db)) -> MemorySuggestionRead:
    return service.reject_suggestion(db, suggestion_id)
