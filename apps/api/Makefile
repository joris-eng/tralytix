SHELL := /bin/bash
API_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

MIGRATIONS_DIR := ./migrations
DATABASE_URL ?= postgres://trading:trading@localhost:5432/trading?sslmode=disable
DOCKER_DATABASE_URL ?= postgres://trading:trading@host.docker.internal:5432/trading?sslmode=disable

.PHONY: dev test lint migrate-up migrate-down sqlc-generate

dev:
	cd "$(API_DIR)" && set -a && source .env && set +a && go run ./cmd/api
	

test:
	go test ./...

lint:
	golangci-lint run ./...

migrate-up:
	@if command -v migrate >/dev/null 2>&1; then \
		migrate -path "$(MIGRATIONS_DIR)" -database "$(DATABASE_URL)" up; \
	else \
		docker run --rm -v "$(PWD)/migrations:/migrations" migrate/migrate -path=/migrations -database "$(DOCKER_DATABASE_URL)" up; \
	fi

migrate-down:
	@if command -v migrate >/dev/null 2>&1; then \
		migrate -path "$(MIGRATIONS_DIR)" -database "$(DATABASE_URL)" down 1; \
	else \
		docker run --rm -v "$(PWD)/migrations:/migrations" migrate/migrate -path=/migrations -database "$(DOCKER_DATABASE_URL)" down 1; \
	fi

sqlc-generate:
	sqlc generate
