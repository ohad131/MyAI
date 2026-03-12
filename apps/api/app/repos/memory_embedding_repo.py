from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.memory_embedding import MemoryEmbedding


class MemoryEmbeddingRepo:
    def get_by_memory_id(self, db: Session, memory_id: str) -> MemoryEmbedding | None:
        stmt = select(MemoryEmbedding).where(MemoryEmbedding.memory_id == memory_id)
        return db.scalar(stmt)
