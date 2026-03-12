from sqlalchemy import create_engine, text
from sqlalchemy.pool import StaticPool

from app.db.migrations import apply_sqlite_migrations


def test_apply_sqlite_migrations_adds_memory_metadata_columns() -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE memories (
                    id VARCHAR(36) PRIMARY KEY,
                    scope VARCHAR(16) NOT NULL,
                    scope_id VARCHAR(36),
                    type VARCHAR(16) NOT NULL,
                    content TEXT NOT NULL,
                    pinned BOOLEAN NOT NULL DEFAULT 0,
                    enabled BOOLEAN NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE memory_suggestions (
                    id VARCHAR(36) PRIMARY KEY,
                    source_conversation_id VARCHAR(36),
                    scope VARCHAR(16) NOT NULL,
                    scope_id VARCHAR(36),
                    type VARCHAR(16) NOT NULL,
                    proposed_content TEXT NOT NULL,
                    status VARCHAR(16) NOT NULL DEFAULT 'pending',
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )

    apply_sqlite_migrations(engine)

    with engine.begin() as conn:
        memory_columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info('memories')")).fetchall()
        }
        assert "always_include" in memory_columns
        assert "importance" in memory_columns
        assert "confidence" in memory_columns
        assert "source" in memory_columns
        assert "tags_json" in memory_columns
        assert "last_used_at" in memory_columns
        assert "times_used" in memory_columns

        suggestion_columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info('memory_suggestions')")).fetchall()
        }
        assert "source_message_id" in suggestion_columns
        assert "confidence" in suggestion_columns
        assert "reason" in suggestion_columns
        assert "candidate_signals_json" in suggestion_columns

        usage_log_columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info('memory_usage_logs')")).fetchall()
        }
        assert "conversation_id" in usage_log_columns
        assert "memory_id" in usage_log_columns
        assert "selected" in usage_log_columns
        assert "injected" in usage_log_columns
        assert "rank_position" in usage_log_columns
        assert "why_shown" in usage_log_columns
        assert "snippet_preview" in usage_log_columns
        assert "failure_reason" in usage_log_columns

        embedding_columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info('memory_embeddings')")).fetchall()
        }
        assert "memory_id" in embedding_columns
        assert "provider" in embedding_columns
        assert "model" in embedding_columns
        assert "dimensions" in embedding_columns
        assert "embedding_json" in embedding_columns
        assert "content_hash" in embedding_columns
        assert "status" in embedding_columns
        assert "error_message" in embedding_columns
        assert "last_indexed_at" in embedding_columns

        conn.execute(
            text(
                """
                INSERT INTO memories (id, scope, type, content, pinned, enabled)
                VALUES ('m1', 'global', 'fact', 'legacy', 0, 1)
                """
            )
        )
        row = conn.execute(
            text(
                """
                SELECT always_include, importance, confidence, times_used
                FROM memories
                WHERE id = 'm1'
                """
            )
        ).fetchone()
        assert row is not None
        assert row[0] == 0
        assert row[1] == 0.5
        assert row[2] == 1.0
        assert row[3] == 0

    engine.dispose()
