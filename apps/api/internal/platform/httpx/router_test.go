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
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", rr.Code)
	}
}
