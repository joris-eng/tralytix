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

## Stack deploiement locale (reproductible)

Pour simuler un deploiement cible avec les memes briques (Postgres + API + Web) :

```bash
make stack-up
```

Services exposes:
- Web: `http://localhost:3000`
- API: `http://localhost:8080`
- Postgres: `localhost:5432`

Arret:

```bash
make stack-down
```

## Deploiement Render

- Blueprints par environnement:
  - `render.staging.yaml`
  - `render.production.yaml`
- Smoke checks post-deploiement:
  - script local/CI: `scripts/smoke-deploy.sh <WEB_URL> <API_URL>`
  - workflow GitHub: `.github/workflows/deploy-smoke.yml`
- Promotion automatisee:
  - `main` -> staging: `.github/workflows/deploy-promote.yml`
  - `tag v*` -> production: `.github/workflows/deploy-promote.yml`
