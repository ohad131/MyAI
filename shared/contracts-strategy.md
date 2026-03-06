# Shared Contracts Strategy (Phase 0/1)

Source of truth is FastAPI OpenAPI schema from `apps/api`.

## Near-term usage
- Frontend consumes REST endpoints directly.
- Generate typed API client from `/openapi.json` when wiring React pages.
- Keep request/response contracts in `apps/api/app/schemas`.

## Future-ready path
- Add generated TypeScript client/types into `shared/contracts/generated`.
- Keep endpoint behavior stable; evolve with additive fields when possible.
- Version breaking changes using endpoint or schema versioning later.

This keeps MVP implementation fast while preserving a clean migration path to strict shared types.
