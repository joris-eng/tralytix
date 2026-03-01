# Deploy Render (staging + production)

Use dedicated blueprint files by environment:

- `render.staging.yaml`
- `render.production.yaml`

Recommended rollout order:

1. Deploy and validate staging.
2. Promote to production after smoke checks pass.

## Create services from blueprint

Render -> **New** -> **Blueprint**:

1. Select repository + branch.
2. Use one blueprint file for the target environment.
3. Apply blueprint.

## Services created

### Staging (`render.staging.yaml`)

- `tralytix-staging-api` (Go, `rootDir: apps/api`)
- `tralytix-staging-web` (Next.js, `rootDir: apps/web`)
- `tralytix-staging-db` (Postgres managed)

### Production (`render.production.yaml`)

- `tralytix-prod-api` (Go, `rootDir: apps/api`)
- `tralytix-prod-web` (Next.js, `rootDir: apps/web`)
- `tralytix-prod-db` (Postgres managed)

## Required env vars

### API (`*-api`)
- `DB_DSN` (from managed Postgres in blueprint)
- Optional: `MT5_IMPORT_MAX_BYTES`, `MT5_IMPORT_MAX_ROWS`, `HTTP_TIMEOUT_SEC`, `RATE_LIMIT_RPM`, `ENABLE_DEV_LOGIN`

Recommended value:
- Staging: `ENABLE_DEV_LOGIN=true`
- Production: `ENABLE_DEV_LOGIN=false`

### WEB (`*-web`)
- `API_BASE_URL` (server-only), example:
  - Staging: `https://tralytix-staging-api.onrender.com`
  - Production: `https://tralytix-prod-api.onrender.com`

Do not set `NEXT_PUBLIC_API_BASE_URL` on the web service. The app only uses server-side `API_BASE_URL`.

## Verify deployment

- API health: `https://<api-service>/health`
- Web proxy health: `https://<web-service>/api/backend/health`
- Web smoke test: `/login` then `/trades` (or `/api-test`)

Automated smoke checks are available in GitHub Actions workflow:

- `.github/workflows/deploy-smoke.yml`
- Promotion workflow:
  - `.github/workflows/deploy-promote.yml`
- Required secrets:
  - `STAGING_WEB_URL`
  - `STAGING_API_URL`
  - `PRODUCTION_WEB_URL`
  - `PRODUCTION_API_URL`
  - `STAGING_API_DEPLOY_HOOK`
  - `STAGING_WEB_DEPLOY_HOOK`
  - `PRODUCTION_API_DEPLOY_HOOK`
  - `PRODUCTION_WEB_DEPLOY_HOOK`

## Promotion strategy

- `main` push -> deploy staging, then smoke checks.
- tag `v*` push -> deploy production, then smoke checks.

Smoke checks include:
- API `/health`
- API `/version`
- Web proxy `/api/backend/health`
- Web proxy `/api/backend/version`
- Web `/login`

## Build traceability

API exposes deployment metadata on `/version`:
- `name`
- `version` (from `APP_VERSION`)
- `commit` (from `APP_COMMIT`)
- `builtAt` (from `APP_BUILT_AT`)

Set these env vars on Render API services to track exactly what is running.

## Rollback

If smoke checks fail after deploy:
1. Open Render service (`*-api` and/or `*-web`).
2. Use **Manual Deploy** on previous known-good commit.
3. Rerun smoke checks:
   - workflow dispatch `deploy-smoke`, or
   - `bash scripts/smoke-deploy.sh <WEB_URL> <API_URL>`.

## Manual deploy

Render service page -> **Manual Deploy** -> **Deploy latest commit** (or clear cache if needed).
