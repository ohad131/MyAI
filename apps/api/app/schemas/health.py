from app.schemas.common import ORMModel


class HealthResponse(ORMModel):
    status: str
    app_env: str
