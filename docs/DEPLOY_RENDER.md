# Deploy Render (quick)

Use the repo blueprint file `render.yaml` from Render:

1. Render -> **New** -> **Blueprint**
2. Select this repository/branch
3. Apply blueprint

## Services created

- `tralytix-api` (Go, `rootDir: apps/api`)
- `tralytix-web` (Next.js, `rootDir: apps/web`)
- `tralytix-db` (Postgres managed)

## Required env vars

### API (`tralytix-api`)
- `DB_DSN` (from managed Postgres in blueprint)
- Optional: `MT5_IMPORT_MAX_BYTES`, `MT5_IMPORT_MAX_ROWS`, `HTTP_TIMEOUT_SEC`, `RATE_LIMIT_RPM`

### WEB (`tralytix-web`)
- `API_BASE_URL` (server-only), example:
  - `https://tralytix-api.onrender.com`

Do not expose backend base URL with `NEXT_PUBLIC_*` in proxy-first mode.

## Verify deployment

- API health: `https://<api-service>/health`
- Web proxy health: `https://<web-service>/api/backend/health`
- Web smoke test: `/login` then `/trades` (or `/api-test`)

## Manual deploy

Render service page -> **Manual Deploy** -> **Deploy latest commit** (or clear cache if needed).
