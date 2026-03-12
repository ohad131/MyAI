from typing import Protocol
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class MemoryEmbeddingProvider(Protocol):
    provider_name: str

    def embed(self, *, model: str, text: str) -> list[float]:
        ...


class OllamaMemoryEmbeddingProvider:
    provider_name = "ollama"

    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.timeout = settings.request_timeout_seconds

    def embed(self, *, model: str, text: str) -> list[float]:
        body = {"model": model, "prompt": text}
        logger.info("ollama embedding request model=%s", model)

        with httpx.Client(timeout=self.timeout) as client:
            response = client.post(f"{self.base_url}/api/embeddings", json=body)
            response.raise_for_status()
            payload = response.json()

        raw_embedding = payload.get("embedding")
        if not isinstance(raw_embedding, list):
            raise ValueError("Embedding response did not include a valid embedding list")

        embedding: list[float] = []
        for value in raw_embedding:
            if not isinstance(value, (int, float)):
                raise ValueError("Embedding vector contains non-numeric values")
            embedding.append(float(value))

        if not embedding:
            raise ValueError("Embedding response returned an empty vector")

        return embedding


def get_memory_embedding_provider(provider_name: str) -> MemoryEmbeddingProvider:
    if provider_name == "ollama":
        return OllamaMemoryEmbeddingProvider()
    raise ValueError(f"Unsupported memory embedding provider: {provider_name}")
