# trading-saas

## Lancement local

### Postgres

```bash
cd infra
docker compose up -d
```

Postgres est expose sur `localhost:5432` avec:
- user: `trading`
- password: `trading`
- database: `trading`

### API

```bash
cd apps/api
go test ./...
go run .
```

### Web

```bash
cd apps/web
npm install
npm run dev
```
