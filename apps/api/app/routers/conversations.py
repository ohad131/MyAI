from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.conversation import ConversationCreate, ConversationRead, ConversationUpdate, MessageRead
from app.services.conversation_service import ConversationService

router = APIRouter(prefix="/conversations", tags=["conversations"])
service = ConversationService()


@router.get("", response_model=list[ConversationRead])
def list_conversations(workspace_id: str = Query(...), db: Session = Depends(get_db)) -> list[ConversationRead]:
    return service.list_conversations(db, workspace_id)


@router.post("", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
def create_conversation(payload: ConversationCreate, db: Session = Depends(get_db)) -> ConversationRead:
    return service.create_conversation(db, payload)


@router.get("/{conversation_id}", response_model=ConversationRead)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)) -> ConversationRead:
    return service.get_conversation_or_404(db, conversation_id)


@router.patch("/{conversation_id}", response_model=ConversationRead)
def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    db: Session = Depends(get_db),
) -> ConversationRead:
    return service.update_conversation(db, conversation_id, payload)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)) -> Response:
    service.delete_conversation(db, conversation_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{conversation_id}/messages", response_model=list[MessageRead])
def list_messages(conversation_id: str, db: Session = Depends(get_db)) -> list[MessageRead]:
    return service.list_messages(db, conversation_id)
