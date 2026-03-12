from typing import Any

from app.models.gem import Gem
from app.models.message import Message

BASE_SYSTEM_PROMPT = (
    "You are MyAI, a local-first assistant running for a single user. "
    "Be transparent, concise, and practical."
)

def build_prompt_messages(
    history: list[Message],
    current_user_message: str,
    gem: Gem | None,
    memory_block: str = "",
) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = [{"role": "system", "content": BASE_SYSTEM_PROMPT}]

    if gem:
        gem_prompt = gem.system_prompt.strip()
        if gem.style_rules_json:
            gem_prompt = f"{gem_prompt}\n\nStyle rules JSON:\n{gem.style_rules_json}"
        messages.append({"role": "system", "content": gem_prompt})

    if memory_block.strip():
        messages.append({"role": "system", "content": memory_block.strip()})

    for msg in history:
        messages.append(
            {
                "role": msg.role,
                "content": msg.content,
            }
        )

    messages.append({"role": "user", "content": current_user_message})
    return messages
