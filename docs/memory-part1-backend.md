# Memory MVP Part 1 (Backend Foundation)

This document describes the backend-only Memory Part 1 implementation.

## What Was Implemented

- New persisted entities in SQLite:
  - `memories`
  - `memory_suggestions`
- Backend layers added for memory domain:
  - SQLAlchemy models
  - Pydantic schemas
  - repositories
  - services
  - API routers
- Validation rules:
  - `scope`: `global | workspace | gem`
  - `type`: `fact | preference | instruction`
  - suggestion `status`: `pending | approved | rejected`
  - scope/scope_id consistency:
    - `global` requires `scope_id = null`
    - `workspace`/`gem` require `scope_id`
  - workspace/gem scope ids are validated against existing records

## Added Routes

All routes are under `/api`.

### Memories

- `GET /memories`
  - filters: `scope`, `scope_id`, `type`, `pinned`, `enabled`
- `POST /memories`
- `PATCH /memories/{id}`
- `DELETE /memories/{id}`

### Memory Suggestions

- `GET /memory/suggestions`
  - filters: `status`, `scope`, `scope_id`, `type`
- `POST /memory/suggestions`
- `POST /memory/suggestions/{id}/approve`
  - creates a real memory
  - moves suggestion status to `approved`
  - supports optional content override (`content`)
- `POST /memory/suggestions/{id}/reject`
  - moves suggestion status to `rejected`

## Entity Fields

### `memories`

- `id`
- `scope`
- `scope_id` (nullable)
- `type`
- `content`
- `pinned` (default `false`)
- `enabled` (default `true`)
- `created_at`
- `updated_at`

### `memory_suggestions`

- `id`
- `source_conversation_id` (nullable)
- `scope`
- `scope_id` (nullable)
- `type`
- `proposed_content`
- `status` (`pending | approved | rejected`)
- `created_at`
- `updated_at`

## Intentionally Not Included In Part 1

- Chat memory injection
- Automatic suggestion extraction from chat
- Embeddings / vector DB / RAG / semantic retrieval
- Frontend memory workflow polish or new memory UI
- Prompt-builder integration
- Background automation for memory extraction
