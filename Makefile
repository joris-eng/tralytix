SHELL := /bin/bash

.PHONY: help check check-api check-web

help:
	@echo "Targets disponibles:"
	@echo "  make check      - Lance check-api puis check-web"
	@echo "  make check-api  - Lance go test ./... dans apps/api"
	@echo "  make check-web  - Lance typecheck, lint, build dans apps/web"

check: check-api check-web

check-api:
	cd apps/api && go test ./...

check-web:
	cd apps/web && pnpm typecheck && pnpm lint && pnpm build
