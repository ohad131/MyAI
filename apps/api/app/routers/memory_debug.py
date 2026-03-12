from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.memory_debug import (
    MemoryEmbeddingRebuildResponse,
    MemoryPreviewItem,
    MemoryRetrievePreviewRequest,
    MemoryRetrievePreviewResponse,
    MemoryUsageLogRead,
)
from app.services.memory_embedding_service import MemoryEmbeddingService
from app.services.gem_service import GemService
from app.services.memory_injection_service import MemoryInjectionService
from app.services.memory_usage_log_service import MemoryUsageLogService
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/memory", tags=["memory-debug"])
memory_injection = MemoryInjectionService()
workspace_service = WorkspaceService()
gem_service = GemService()
usage_log_service = MemoryUsageLogService(memory_injection=memory_injection)
memory_embedding_service = MemoryEmbeddingService()


@router.get("/usage-logs", response_model=list[MemoryUsageLogRead])
def list_memory_usage_logs(
    conversation_id: str | None = Query(default=None),
    workspace_id: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    injected_only: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[MemoryUsageLogRead]:
    return usage_log_service.list_logs(
        db,
        conversation_id=conversation_id,
        workspace_id=workspace_id,
        injected_only=injected_only,
        limit=limit,
    )


@router.post("/retrieve-preview", response_model=MemoryRetrievePreviewResponse)
def retrieve_memory_preview(
    payload: MemoryRetrievePreviewRequest,
    db: Session = Depends(get_db),
) -> MemoryRetrievePreviewResponse:
    workspace = workspace_service.get_workspace_or_404(db, payload.workspace_id)
    if payload.gem_id:
        gem_service.ensure_workspace_access(db, payload.gem_id, workspace.id)

    selection_result = memory_injection.select_for_chat_with_explanations(
        db=db,
        workspace=workspace,
        gem_id=payload.gem_id,
    )

    return MemoryRetrievePreviewResponse(
        selected_memories=[
            MemoryPreviewItem(
                memory=item.memory,
                rank_position=item.rank_position,
                why_shown=item.why_shown,
            )
            for item in selection_result.items
        ],
        memory_block=selection_result.memory_block,
        caps=selection_result.caps,
    )


@router.post("/index/rebuild", response_model=MemoryEmbeddingRebuildResponse)
def rebuild_memory_embeddings(
    db: Session = Depends(get_db),
) -> MemoryEmbeddingRebuildResponse:
    summary = memory_embedding_service.rebuild_embeddings(db)
    return MemoryEmbeddingRebuildResponse(**summary)
