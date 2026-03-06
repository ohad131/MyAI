from fastapi import APIRouter

from app.schemas.model import ModelsResponse
from app.services.model_service import ModelService

router = APIRouter(tags=["models"])
service = ModelService()


@router.get("/models", response_model=ModelsResponse)
async def list_models() -> ModelsResponse:
    return await service.list_models()
