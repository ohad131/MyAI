from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.memory import Memory
from app.schemas.memory import MemoryCreate
from app.schemas.memory_enums import MemoryScope, MemoryType
from app.utils.json_codec import dump_json_text


class MemoryRepo:
    def list(
        self,
        db: Session,
        scope: MemoryScope | None = None,
        scope_id: str | None = None,
        type: MemoryType | None = None,
        pinned: bool | None = None,
        enabled: bool | None = None,
    ) -> list[Memory]:
        stmt = select(Memory).order_by(Memory.updated_at.desc())
        if scope is not None:
            stmt = stmt.where(Memory.scope == scope.value)
        if scope_id is not None:
            stmt = stmt.where(Memory.scope_id == scope_id)
        if type is not None:
            stmt = stmt.where(Memory.type == type.value)
        if pinned is not None:
            stmt = stmt.where(Memory.pinned.is_(pinned))
        if enabled is not None:
            stmt = stmt.where(Memory.enabled.is_(enabled))
        return list(db.scalars(stmt).all())

    def get(self, db: Session, memory_id: str) -> Memory | None:
        return db.get(Memory, memory_id)

    def create(self, db: Session, payload: MemoryCreate, commit: bool = True) -> Memory:
        memory = Memory(
            scope=payload.scope.value,
            scope_id=payload.scope_id,
            type=payload.type.value,
            content=payload.content,
            pinned=payload.pinned,
            enabled=payload.enabled,
            always_include=payload.always_include,
            importance=payload.importance,
            confidence=payload.confidence,
            source=payload.source,
            tags_json=dump_json_text(payload.tags_json),
            last_used_at=payload.last_used_at,
            times_used=payload.times_used,
        )
        db.add(memory)
        if commit:
            db.commit()
            db.refresh(memory)
        return memory

    def create_from_values(
        self,
        db: Session,
        scope: MemoryScope,
        scope_id: str | None,
        type: MemoryType,
        content: str,
        pinned: bool = False,
        enabled: bool = True,
        always_include: bool = False,
        importance: float = 0.5,
        confidence: float = 1.0,
        source: str | None = None,
        tags_json: "list[str] | None" = None,
        last_used_at: datetime | None = None,
        times_used: int = 0,
        commit: bool = True,
    ) -> Memory:
        memory = Memory(
            scope=scope.value,
            scope_id=scope_id,
            type=type.value,
            content=content,
            pinned=pinned,
            enabled=enabled,
            always_include=always_include,
            importance=importance,
            confidence=confidence,
            source=source,
            tags_json=dump_json_text(tags_json),
            last_used_at=last_used_at,
            times_used=times_used,
        )
        db.add(memory)
        if commit:
            db.commit()
            db.refresh(memory)
        return memory

    def update_fields(self, db: Session, memory: Memory, fields: dict[str, object], commit: bool = True) -> Memory:
        for field, value in fields.items():
            if field == "scope" and isinstance(value, MemoryScope):
                setattr(memory, field, value.value)
                continue
            if field == "type" and isinstance(value, MemoryType):
                setattr(memory, field, value.value)
                continue
            if field == "tags_json":
                setattr(memory, field, dump_json_text(value))
                continue
            setattr(memory, field, value)
        db.add(memory)
        if commit:
            db.commit()
            db.refresh(memory)
        return memory

    def delete(self, db: Session, memory: Memory) -> None:
        db.delete(memory)
        db.commit()
