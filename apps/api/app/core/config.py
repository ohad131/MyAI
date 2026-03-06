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

    request_timeout_seconds: float = 120.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
