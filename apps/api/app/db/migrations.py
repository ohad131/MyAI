from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


MEMORY_COLUMN_MIGRATIONS: tuple[tuple[str, str], ...] = (
    ("always_include", "BOOLEAN NOT NULL DEFAULT 0"),
    ("importance", "FLOAT NOT NULL DEFAULT 0.5"),
    ("confidence", "FLOAT NOT NULL DEFAULT 1.0"),
    ("source", "VARCHAR(255)"),
    ("tags_json", "TEXT"),
    ("last_used_at", "DATETIME"),
    ("times_used", "INTEGER NOT NULL DEFAULT 0"),
)

MEMORY_SUGGESTION_COLUMN_MIGRATIONS: tuple[tuple[str, str], ...] = (
    ("source_message_id", "VARCHAR(36)"),
    ("confidence", "FLOAT"),
    ("reason", "TEXT"),
    ("candidate_signals_json", "TEXT"),
)

MEMORY_EMBEDDING_COLUMN_MIGRATIONS: tuple[tuple[str, str], ...] = (
    ("memory_id", "VARCHAR(36)"),
    ("provider", "VARCHAR(64) NOT NULL DEFAULT 'ollama'"),
    ("model", "VARCHAR(128) NOT NULL DEFAULT 'nomic-embed-text'"),
    ("dimensions", "INTEGER NOT NULL DEFAULT 0"),
    ("embedding_json", "TEXT"),
    ("content_hash", "VARCHAR(64) NOT NULL DEFAULT ''"),
    ("status", "VARCHAR(16) NOT NULL DEFAULT 'ready'"),
    ("error_message", "TEXT"),
    ("last_indexed_at", "DATETIME"),
)


def apply_sqlite_migrations(engine: Engine) -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        if "memories" in existing_tables:
            _add_missing_columns(conn, "memories", MEMORY_COLUMN_MIGRATIONS)
        if "memory_suggestions" in existing_tables:
            _add_missing_columns(conn, "memory_suggestions", MEMORY_SUGGESTION_COLUMN_MIGRATIONS)
        if "memory_embeddings" in existing_tables:
            _add_missing_columns(conn, "memory_embeddings", MEMORY_EMBEDDING_COLUMN_MIGRATIONS)
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ux_memory_embeddings_memory_id ON memory_embeddings (memory_id)"
                )
            )
        if "memory_embeddings" not in existing_tables:
            conn.execute(
                text(
                    """
                    CREATE TABLE memory_embeddings (
                        id VARCHAR(36) PRIMARY KEY,
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        memory_id VARCHAR(36) NOT NULL,
                        provider VARCHAR(64) NOT NULL,
                        model VARCHAR(128) NOT NULL,
                        dimensions INTEGER NOT NULL DEFAULT 0,
                        embedding_json TEXT,
                        content_hash VARCHAR(64) NOT NULL,
                        status VARCHAR(16) NOT NULL DEFAULT 'ready',
                        error_message TEXT,
                        last_indexed_at DATETIME,
                        FOREIGN KEY(memory_id) REFERENCES memories(id) ON DELETE CASCADE
                    )
                    """
                )
            )
            conn.execute(
                text("CREATE UNIQUE INDEX IF NOT EXISTS ux_memory_embeddings_memory_id ON memory_embeddings (memory_id)")
            )
        if "memory_usage_logs" not in existing_tables:
            conn.execute(
                text(
                    """
                    CREATE TABLE memory_usage_logs (
                        id VARCHAR(36) PRIMARY KEY,
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        conversation_id VARCHAR(36),
                        message_id VARCHAR(36),
                        workspace_id VARCHAR(36),
                        gem_id VARCHAR(36),
                        memory_id VARCHAR(36),
                        memory_scope VARCHAR(16),
                        selected BOOLEAN NOT NULL DEFAULT 1,
                        injected BOOLEAN NOT NULL DEFAULT 1,
                        rank_position INTEGER,
                        why_shown VARCHAR(255),
                        snippet_preview VARCHAR(255),
                        failure_reason TEXT
                    )
                    """
                )
            )


def _add_missing_columns(conn, table_name: str, columns: tuple[tuple[str, str], ...]) -> None:  # type: ignore[no-untyped-def]
    existing = {
        row[1]
        for row in conn.execute(text(f"PRAGMA table_info('{table_name}')")).fetchall()
    }
    for name, sql_type in columns:
        if name in existing:
            continue
        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {name} {sql_type}"))
