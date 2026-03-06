from app.schemas.common import ORMModel


class ModelEntry(ORMModel):
    id: str
    provider: str


class ModelsResponse(ORMModel):
    models: list[ModelEntry]
    default_model: str
