# MyAI

## Web Layer Migration (Vite -> Next.js App Router)

The frontend was migrated from Vite + React + Express static serving to **Next.js App Router**.

### What changed
- Frontend now runs from `src/app` (Next App Router).
- Existing UI code was migrated to:
  - `src/components`
  - `src/contexts`
  - `src/hooks`
  - `src/lib`
  - `src/views` (migrated page/view components)
- Existing route URLs were preserved:
  - `/`
  - `/chat`
  - `/code`
  - `/images`
  - `/agents`
  - `/memory`
  - `/settings`
  - `/design-system`
  - plus Next `not-found` handling
- FastAPI backend in `apps/api` remains the source of truth.
- Vite/Express delivery files were removed.

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

Frontend runs on `http://localhost:3000`.

## Environment Variables

Frontend envs are now Next-style public env vars:

- `NEXT_PUBLIC_API_BASE_URL` (default: `http://127.0.0.1:8000/api`)
- `NEXT_PUBLIC_OAUTH_PORTAL_URL` (optional, for login URL helper)
- `NEXT_PUBLIC_APP_ID` (optional, for login URL helper)
- `NEXT_PUBLIC_FRONTEND_FORGE_API_KEY` (optional, map integration)
- `NEXT_PUBLIC_FRONTEND_FORGE_API_URL` (optional, defaults internally)

Example `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

## Scripts

- `pnpm dev` - start Next.js dev server
- `pnpm build` - production build
- `pnpm start` - start production server
- `pnpm check` - TypeScript check
- `pnpm format` - Prettier
