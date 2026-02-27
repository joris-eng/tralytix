SHELL := /bin/bash

.PHONY: help check check-api check-web stack-up stack-down stack-logs

help:
	@echo "Targets disponibles:"
	@echo "  make check      - Lance check-api puis check-web"
	@echo "  make check-api  - Lance go test ./... dans apps/api"
	@echo "  make check-web  - Lance typecheck, lint, build dans apps/web"
	@echo "  make stack-up   - Lance postgres + migrate + api + web via Docker Compose"
	@echo "  make stack-down - Stoppe la stack Docker Compose"
	@echo "  make stack-logs - Affiche les logs de la stack Docker Compose"

check: check-api check-web

check-api:
	cd apps/api && go test ./...

check-web:
	cd apps/web && pnpm typecheck && pnpm lint && pnpm build

stack-up:
	cd infra && docker compose -f docker-compose.stack.yml up -d --build

stack-down:
	cd infra && docker compose -f docker-compose.stack.yml down

stack-logs:
	cd infra && docker compose -f docker-compose.stack.yml logs -f --tail=200
