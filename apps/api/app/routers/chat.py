from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter(tags=["chat"])
service = ChatService()


@router.post("/chat", response_model=ChatResponse)
async def run_chat(payload: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    return await service.execute_chat(db, payload)
