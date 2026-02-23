package httpx

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestHealthcheck_OK(t *testing.T) {
	router := NewRouter(RouterDeps{
		Name:           "api",
		Version:        "test",
		RequestTimeout: 15 * time.Second,
		HealthCheck: func(_ context.Context) error {
			return nil
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var payload map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["status"] != "ok" || payload["db"] != "ok" {
		t.Fatalf("unexpected payload: %+v", payload)
	}
}

func TestHealthcheck_DBDown(t *testing.T) {
	router := NewRouter(RouterDeps{
		Name:           "api",
		Version:        "test",
		RequestTimeout: 15 * time.Second,
		HealthCheck: func(_ context.Context) error {
			return errors.New("db unavailable")
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	req.Header.Set("X-Request-ID", "req-health-dbdown-1")
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", rr.Code)
	}

	var payload map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	errorPayload, ok := payload["error"].(map[string]any)
	if !ok {
		t.Fatalf("expected nested error payload, got %v", payload)
	}
	if errorPayload["code"] != "SERVICE_UNAVAILABLE" {
		t.Fatalf("expected code SERVICE_UNAVAILABLE, got %v", errorPayload["code"])
	}
	if errorPayload["message"] != "service degraded" {
		t.Fatalf("expected message service degraded, got %v", errorPayload["message"])
	}
	details, ok := errorPayload["details"].(map[string]any)
	if !ok {
		t.Fatalf("expected details object, got %v", errorPayload["details"])
	}
	if details["status"] != "degraded" || details["db"] != "down" {
		t.Fatalf("unexpected details payload: %v", details)
	}
	if errorPayload["requestId"] != "req-health-dbdown-1" {
		t.Fatalf("expected requestId req-health-dbdown-1, got %v", errorPayload["requestId"])
	}
}
