from enum import Enum


class MemoryScope(str, Enum):
    GLOBAL = "global"
    WORKSPACE = "workspace"
    GEM = "gem"


class MemoryType(str, Enum):
    FACT = "fact"
    PREFERENCE = "preference"
    INSTRUCTION = "instruction"


class MemorySuggestionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
