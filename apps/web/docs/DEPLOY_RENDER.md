# Deploy Render (apps/web)

This guide is the canonical deployment runbook for the Next.js web app in this monorepo.

## 1) Deploy mode: Blueprint (recommended)

1. Push `render.yaml` to the repository root.
2. In Render: **New** -> **Blueprint**.
3. Select this repository/branch.
4. Apply the blueprint.

The blueprint provisions:
- `tralytix-api` (Go web service from `apps/api`)
- `tralytix-web` (Next.js web service from `apps/web`)
- `tralytix-db` (Postgres)

If you already have a Postgres instance, keep it and update `DB_DSN` manually instead of creating a new DB.

## 2) Root directory and why

For the web service:
- **Root Directory** must be `apps/web`

Why:
- This is a monorepo.
- Next.js app scripts and dependencies live in `apps/web/package.json`.
- Running from repo root would execute the wrong project.

## 3) Build/start commands (web)

Expected web commands:
- **Build**: `pnpm install --frozen-lockfile && pnpm build`
- **Start**: `pnpm start -p $PORT`

## 4) Required environment variables

### Web (`tralytix-web`)
- `API_BASE_URL` (server-only)
  - Example (Render): `https://tralytix-api.onrender.com`
  - In blueprint it is set explicitly to the API service URL.

Do not expose backend routing via public env vars.

### API (`tralytix-api`)
- `DB_DSN` (required) -> from Postgres connection string
- Optional tuning vars:
  - `MT5_IMPORT_MAX_BYTES` (default `10485760`)
  - `MT5_IMPORT_MAX_ROWS` (default `20000`)
  - `HTTP_TIMEOUT_SEC` (default `15`)
  - `RATE_LIMIT_RPM` (default `100`)
  - `ENABLE_DEV_LOGIN` (recommended `false` in production)

## 5) Verification after deploy

1. API health:
   - `https://<api-service>/health`
2. Web proxy health:
   - `https://<web-service>/api/backend/health`
3. UI checks:
   - Open `https://<web-service>/api-test`
   - Open `https://<web-service>/login`, run **Login (dev)**, confirm redirect to `/trades`

## 6) Common failure modes

### `"Backend not configured"` (500)
- Cause: `API_BASE_URL` missing on web service
- Fix: set `API_BASE_URL` and redeploy

### Wrong backend target
- Cause: malformed `API_BASE_URL`
- Fix: use full origin only, no `/backend`, no trailing API path
  - Good: `https://tralytix-api.onrender.com`
  - Bad: `https://tralytix-api.onrender.com/backend`

### Timeout / 502/504 through proxy
- Cause: API unreachable, cold start, or network issue
- Fix: verify API `/health`, inspect Render logs, retry after API is live

## 7) CI / PR discipline

- Run `make check` before pushing.
- Use Pull Requests for changes targeting `main`.
