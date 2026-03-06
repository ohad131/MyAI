from app.providers.base import ChatProvider
from app.providers.ollama import OllamaProvider


class ProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, ChatProvider] = {
            "ollama": OllamaProvider(),
        }
        self._default_provider = "ollama"

    def default(self) -> ChatProvider:
        return self._providers[self._default_provider]

    def get(self, name: str) -> ChatProvider:
        return self._providers[name]
