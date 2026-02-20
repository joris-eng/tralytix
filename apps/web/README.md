# web

## Run locally

```bash
pnpm install
pnpm dev
```

App URL: `http://localhost:3000`

## API integration (modular client)

### Run

```bash
pnpm install
pnpm dev
```

Ensure `apps/web/.env.local` contains:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Dev login flow

- `devLogin(email)` calls `POST /v1/auth/dev-login`.
- The token is stored by `tokenStore` (memory + `localStorage` in browser).
- API requests with `auth: true` automatically send `Authorization: Bearer <token>`.

### Add a new endpoint module

1. Add endpoint path constants in `src/lib/api/endpoints.ts`.
2. Create a focused module in `src/lib/api/<feature>.ts`.
3. Use `httpClient.request<T>()` from `src/lib/http/client.ts`.
4. Keep components free from direct `fetch`; call hook/service modules only.
