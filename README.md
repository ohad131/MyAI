# MyAI

MyAI uses a Next.js App Router frontend at repo root and a FastAPI backend in `apps/api`.

## Project Structure

- `src/app` - Next.js App Router entrypoints and metadata files
- `src/components` - shared UI components and app shell
- `src/contexts` - app-wide React contexts
- `src/hooks` - reusable client hooks
- `src/lib` - shared frontend utilities/config
- `src/views` - migrated feature/page view components
- `public` - static frontend assets
- `shared` - shared constants/contracts docs
- `apps/api` - FastAPI backend (source of truth for API contracts)

## Route Notes

Current frontend routes:
- `/`
- `/chat`
- `/code`
- `/images`
- `/agents`
- `/memory`
- `/settings`
- `/design-system`
- `not-found` for unknown paths

Compatibility redirect:
- `/workspace` redirects to `/` (temporary redirect for legacy links)

## Node & Package Manager

- Node: `>=20.11.0`
- pnpm: `>=10`
- `.nvmrc` is provided (`20`)

## Running Locally

### 1) Start backend (FastAPI)

From `apps/api`:

```bash
# example (use your preferred runner/environment)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Start frontend (Next.js)

From repo root:

```bash
pnpm dev
```

Frontend default: `http://localhost:3000`.

## Environment Variables

Frontend envs:
- `NEXT_PUBLIC_API_BASE_URL` (default in code: `http://127.0.0.1:8000/api`)
- `NEXT_PUBLIC_SITE_URL` (optional; used for metadataBase, robots, sitemap)
- `NEXT_PUBLIC_OAUTH_PORTAL_URL` (optional)
- `NEXT_PUBLIC_APP_ID` (optional)
- `NEXT_PUBLIC_FRONTEND_FORGE_API_KEY` (optional; map integration)
- `NEXT_PUBLIC_FRONTEND_FORGE_API_URL` (optional; map integration)

See `.env.example` for a template.

## Scripts

- `pnpm dev` - start Next.js dev server
- `pnpm build` - production build
- `pnpm start` - start production server
- `pnpm check` - TypeScript check
- `pnpm lint` - ESLint
- `pnpm lint:fix` - ESLint autofix
- `pnpm test` - Vitest (run once)
- `pnpm test:watch` - Vitest watch mode
- `pnpm analyze` - bundle analysis build (`ANALYZE=true`)
- `pnpm format` - Prettier
