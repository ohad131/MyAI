from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.audit import AuditLogRead
from app.services.audit_service import AuditService

router = APIRouter(tags=["logs"])
service = AuditService()


@router.get("/logs", response_model=list[AuditLogRead])
def list_logs(limit: int = Query(default=200, ge=1, le=1000), db: Session = Depends(get_db)) -> list[AuditLogRead]:
    return service.list_logs(db, limit=limit)
