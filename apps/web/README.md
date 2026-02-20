# web

## Run locally

```bash
cd apps/web
pnpm install
cp .env.example .env.local
pnpm dev
```

App URL: `http://localhost:3000`

Backend expected: `http://localhost:8080` with API prefix `/v1`.

## Environment variables

- `NEXT_PUBLIC_API_BASE=http://localhost:8080/v1`

## Dev login flow

1. Open `/login`
2. Keep default `dev@local.test`
3. Submit -> token stored in localStorage (`tralytix_token`)
4. Go to `/` dashboard

## Dashboard path

`/login` -> `/` -> sections:
- Health + Version
- MT5 status
- MT5 CSV import
- Trades list/create
- Analytics summary/insights/equity + recompute
- Marketdata candles probe

## Feature pattern (anti-regression)

1. Add endpoint call in `src/shared/api/apiClient.ts`
2. Define zod schema in `src/features/<feature>/model.ts`
3. Implement typed calls in `src/features/<feature>/api.ts`
4. Add hooks in `src/features/<feature>/hooks.ts`
5. Render from `src/features/<feature>/ui/*` only (no direct fetch in components)
