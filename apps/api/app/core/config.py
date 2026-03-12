from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MyAI API"
    app_env: str = "development"
    api_prefix: str = "/api"

    sqlite_db_path: str = "./data/myai.db"
    ollama_base_url: str = "http://127.0.0.1:11434"
    comfyui_base_url: str = "http://127.0.0.1:8188"

    default_model: str = "qwen3.5:9b"
    default_language: str = "he"

    memory_embedding_enabled: bool = True
    memory_embedding_provider: str = "ollama"
    memory_embedding_model: str = "nomic-embed-text"

    request_timeout_seconds: float = 120.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
