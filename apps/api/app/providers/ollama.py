from typing import Any

import httpx
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class OllamaProvider:
    provider_name = "ollama"

    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.timeout = settings.request_timeout_seconds

    async def list_models(self) -> list[str]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            payload = response.json()
        models = payload.get("models", [])
        return [m.get("name", "") for m in models if m.get("name")]

    async def chat(self, model: str, messages: list[dict[str, Any]], think: bool = False) -> dict[str, Any]:
        body: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": False,
        }
        body["think"] = think
        logger.info("ollama request model=%s think=%s", model, think)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(f"{self.base_url}/api/chat", json=body)
            response.raise_for_status()
            payload = response.json()

        message = payload.get("message", {})
        return {
            "content": message.get("content", ""),
            "raw": payload,
        }
