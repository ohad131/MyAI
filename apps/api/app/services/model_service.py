from fastapi import HTTPException

from app.core.config import settings
from app.providers.registry import ProviderRegistry
from app.schemas.model import ModelEntry, ModelsResponse


class ModelService:
    def __init__(self, registry: ProviderRegistry | None = None) -> None:
        self.registry = registry or ProviderRegistry()

    async def list_models(self) -> ModelsResponse:
        provider = self.registry.default()
        try:
            models = await provider.list_models()
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Failed to fetch models from provider: {exc}") from exc
        entries = [ModelEntry(id=model, provider=provider.provider_name) for model in models]
        return ModelsResponse(models=entries, default_model=settings.default_model)
