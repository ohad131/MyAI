import json
from typing import Any

JSONContainer = dict[str, Any] | list[Any]
JSONValue = JSONContainer | str | int | float | bool | None


def parse_json_text(value: str | None) -> JSONContainer | None:
    if value is None:
        return None
    try:
        loaded = json.loads(value)
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid JSON") from exc
    if isinstance(loaded, (dict, list)):
        return loaded
    raise ValueError("JSON text must decode into dict or list")


def dump_json_text(value: JSONContainer | None) -> str | None:
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False)
