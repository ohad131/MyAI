from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
import hashlib
import logging
import re

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.memory import Memory
from app.models.memory_embedding import MemoryEmbedding
from app.repos.memory_embedding_repo import MemoryEmbeddingRepo
from app.repos.memory_repo import MemoryRepo
from app.services.memory_embedding_provider import MemoryEmbeddingProvider, get_memory_embedding_provider
from app.utils.json_codec import dump_json_text

logger = logging.getLogger(__name__)


INDEX_RESULT_CREATED = "created"
INDEX_RESULT_UPDATED = "updated"
INDEX_RESULT_SKIPPED = "skipped"
INDEX_RESULT_FAILED = "failed"


@dataclass
class MemoryEmbeddingRebuildSummary:
    processed: int = 0
    created: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0

    def to_dict(self) -> dict[str, int]:
        return {
            "processed": self.processed,
            "created": self.created,
            "updated": self.updated,
            "skipped": self.skipped,
            "failed": self.failed,
        }


class MemoryEmbeddingService:
    def __init__(
        self,
        embedding_repo: MemoryEmbeddingRepo | None = None,
        memory_repo: MemoryRepo | None = None,
        provider: MemoryEmbeddingProvider | None = None,
    ) -> None:
        self.embedding_repo = embedding_repo or MemoryEmbeddingRepo()
        self.memory_repo = memory_repo or MemoryRepo()
        self.provider = provider
        self._provider_cache: dict[str, MemoryEmbeddingProvider] = {}

    def index_memory_non_fatal(self, db: Session, memory: Memory, force: bool = False) -> str:
        try:
            return self.index_memory(db, memory, force=force)
        except Exception:
            db.rollback()
            logger.exception("memory embedding indexing failed unexpectedly memory_id=%s", memory.id)
            return INDEX_RESULT_FAILED

    def index_memory(self, db: Session, memory: Memory, force: bool = False) -> str:
        if not settings.memory_embedding_enabled:
            return INDEX_RESULT_SKIPPED

        provider_name = settings.memory_embedding_provider.strip().lower()
        model = settings.memory_embedding_model.strip()
        normalized_content = self.normalize_content(memory.content)
        content_hash = self.content_hash(normalized_content)

        existing = self.embedding_repo.get_by_memory_id(db, memory.id)
        if self._should_skip(existing, provider_name, model, content_hash, force=force):
            return INDEX_RESULT_SKIPPED

        try:
            embedding_provider = self._resolve_provider(provider_name)
            embedding = embedding_provider.embed(model=model, text=normalized_content)
            self._save_success(
                db=db,
                memory=memory,
                existing=existing,
                provider_name=provider_name,
                model=model,
                content_hash=content_hash,
                embedding=embedding,
            )
            if existing is None:
                return INDEX_RESULT_CREATED
            return INDEX_RESULT_UPDATED
        except Exception as exc:
            self._save_failure(
                db=db,
                memory=memory,
                existing=existing,
                provider_name=provider_name,
                model=model,
                content_hash=content_hash,
                exc=exc,
            )
            logger.exception("memory embedding generation failed memory_id=%s", memory.id)
            return INDEX_RESULT_FAILED

    def rebuild_embeddings(self, db: Session, force: bool = False) -> dict[str, int]:
        memories = self.memory_repo.list(db)
        summary = MemoryEmbeddingRebuildSummary()

        for memory in memories:
            summary.processed += 1
            result = self.index_memory_non_fatal(db, memory, force=force)
            if result == INDEX_RESULT_CREATED:
                summary.created += 1
            elif result == INDEX_RESULT_UPDATED:
                summary.updated += 1
            elif result == INDEX_RESULT_SKIPPED:
                summary.skipped += 1
            elif result == INDEX_RESULT_FAILED:
                summary.failed += 1

        return summary.to_dict()

    @staticmethod
    def normalize_content(content: str) -> str:
        return re.sub(r"\s+", " ", (content or "").strip())

    @staticmethod
    def content_hash(content: str) -> str:
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    @staticmethod
    def _should_skip(
        existing: MemoryEmbedding | None,
        provider_name: str,
        model: str,
        content_hash: str,
        *,
        force: bool,
    ) -> bool:
        if force or existing is None:
            return False
        return (
            existing.provider == provider_name
            and existing.model == model
            and existing.content_hash == content_hash
            and bool(existing.embedding_json)
            and existing.status == "ready"
        )

    def _resolve_provider(self, provider_name: str) -> MemoryEmbeddingProvider:
        if self.provider is not None:
            return self.provider

        cached = self._provider_cache.get(provider_name)
        if cached is not None:
            return cached

        resolved = get_memory_embedding_provider(provider_name)
        self._provider_cache[provider_name] = resolved
        return resolved

    def _save_success(
        self,
        *,
        db: Session,
        memory: Memory,
        existing: MemoryEmbedding | None,
        provider_name: str,
        model: str,
        content_hash: str,
        embedding: list[float],
    ) -> None:
        now = datetime.now(UTC)
        row = existing or MemoryEmbedding(
            memory_id=memory.id,
            provider=provider_name,
            model=model,
            dimensions=len(embedding),
            embedding_json=dump_json_text(embedding),
            content_hash=content_hash,
            status="ready",
            error_message=None,
            last_indexed_at=now,
        )
        row.provider = provider_name
        row.model = model
        row.dimensions = len(embedding)
        row.embedding_json = dump_json_text(embedding)
        row.content_hash = content_hash
        row.status = "ready"
        row.error_message = None
        row.last_indexed_at = now

        db.add(row)
        db.commit()
        db.refresh(row)

    def _save_failure(
        self,
        *,
        db: Session,
        memory: Memory,
        existing: MemoryEmbedding | None,
        provider_name: str,
        model: str,
        content_hash: str,
        exc: Exception,
    ) -> None:
        error_message = str(exc)[:1000]
        row = existing or MemoryEmbedding(
            memory_id=memory.id,
            provider=provider_name,
            model=model,
            dimensions=0,
            embedding_json=None,
            content_hash=content_hash,
            status="error",
            error_message=error_message,
            last_indexed_at=None,
        )

        row.provider = provider_name
        row.model = model
        row.status = "error"
        row.error_message = error_message
        row.last_indexed_at = None

        if row.embedding_json is None:
            row.content_hash = content_hash

        db.add(row)
        db.commit()
        db.refresh(row)
