from typing import Any, Protocol


class ChatProvider(Protocol):
    provider_name: str

    async def list_models(self) -> list[str]:
        ...

    async def chat(self, model: str, messages: list[dict[str, Any]], think: bool = False) -> dict[str, Any]:
        ...
