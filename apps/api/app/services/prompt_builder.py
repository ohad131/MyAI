from typing import Any

from app.models.gem import Gem
from app.models.message import Message

BASE_SYSTEM_PROMPT = (
    "You are MyAI, a local-first assistant running for a single user. "
    "Be transparent, concise, and practical."
)

MEMORY_PLACEHOLDER_PROMPT = (
    "[Memory placeholder] Memory retrieval is not implemented in this phase. "
    "Treat this section as reserved for future profile/global/workspace memory injection."
)


def build_prompt_messages(
    history: list[Message],
    current_user_message: str,
    gem: Gem | None,
) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = [{"role": "system", "content": BASE_SYSTEM_PROMPT}]

    if gem:
        gem_prompt = gem.system_prompt.strip()
        if gem.style_rules_json:
            gem_prompt = f"{gem_prompt}\n\nStyle rules JSON:\n{gem.style_rules_json}"
        messages.append({"role": "system", "content": gem_prompt})

    messages.append({"role": "system", "content": MEMORY_PLACEHOLDER_PROMPT})

    for msg in history:
        messages.append(
            {
                "role": msg.role,
                "content": msg.content,
            }
        )

    messages.append({"role": "user", "content": current_user_message})
    return messages
