# Render Deployment Runbook (apps/web)

This runbook documents the exact steps to deploy the Next.js web app from this monorepo to Render.

## 1) Create the Render Web Service

1. In Render, create a new **Web Service** from the `tralytix` GitHub repository.
2. Configure:
   - **Root Directory**: `apps/web`
   - **Environment**: `Node`

### Why Root Directory must be `apps/web`

This repository is a monorepo. The Next.js app lives under `apps/web`, with its own `package.json`, scripts, and build output.
Setting the root to the repo root would make Render run commands in the wrong project.

## 2) Build and start commands (pnpm)

Because the root directory is already `apps/web`, use local app scripts:

- **Build Command**:
  - `pnpm install --frozen-lockfile && pnpm build`
- **Start Command**:
  - `pnpm start`

These map to:
- `build` -> `next build`
- `start` -> `next start`

## 3) Required environment variables (server-only)

Set this in Render **for the web service**:

- `API_BASE_URL=https://tralytix.onrender.com`

Notes:
- `API_BASE_URL` is read server-side by the proxy route: `src/app/api/backend/[...path]/route.ts`.
- `NEXT_PUBLIC_API_BASE_URL` is not used by the app. Remove it from Render web env to avoid confusion.

## 4) Post-deploy verification

After deploy is **Live**, verify in this order:

1. Health through proxy:
   - `https://tralytix-web.onrender.com/api/backend/health`
   - Expected: JSON like `{"status":"ok","db":"ok"}`
2. Web login flow:
   - Open `https://tralytix-web.onrender.com/login`
   - Submit **Login (dev)**
   - Expected: redirect to `/trades`
3. Internal test page:
   - Open `https://tralytix-web.onrender.com/api-test`
   - Check `/health` and `/v1/trades` actions

## 5) Common failure modes and fixes

### A) `"Backend not configured"` (HTTP 500 from `/api/backend/...`)

Cause:
- `API_BASE_URL` missing on Render web service.

Fix:
- Add `API_BASE_URL=https://tralytix.onrender.com`
- Redeploy (`Save, rebuild, and deploy`)

### B) Timeout / `Gateway timeout` (HTTP 504)

Cause:
- Backend unavailable/cold start/network delay.

Fix:
- Verify backend health directly: `https://tralytix.onrender.com/health`
- Restart/redeploy backend service if needed
- Retry once backend is healthy

### C) Wrong target URL (proxy forwards to wrong host/path)

Cause:
- Incorrect `API_BASE_URL` value.

Fix:
- Ensure exact value: `https://tralytix.onrender.com`
- No trailing `/backend` or `/v1` required

### D) Login works locally but not on Render

Checklist:
- Web service has `API_BASE_URL` set
- Web service does not define `NEXT_PUBLIC_API_BASE_URL`
- Backend service is live and healthy
- Deployment includes latest commit

## 6) CI/PR discipline

- Run `make check` before pushing.
- Open a Pull Request for changes to `main` (no direct pushes to `main`).
