package http

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
)

type allowAuthMW struct{}

func (allowAuthMW) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := authctx.WithAuthUserID(r.Context(), "user-123")
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

type denyAuthMW struct{}

func (denyAuthMW) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
	})
}

func TestHandler_Me_UnauthorizedWhenMiddlewareRejects(t *testing.T) {
	h := NewHandler(nil, denyAuthMW{}, true)
	r := chi.NewRouter()
	h.RegisterRoutes(r)

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rr.Code)
	}
}

func TestHandler_Me_ReturnsUserID(t *testing.T) {
	h := NewHandler(nil, allowAuthMW{}, true)
	r := chi.NewRouter()
	h.RegisterRoutes(r)

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got := body["user_id"]; got != "user-123" {
		t.Fatalf("expected user_id %q, got %q", "user-123", got)
	}
}

func TestHandler_DevLogin_Disabled_ReturnsForbidden(t *testing.T) {
	h := NewHandler(nil, allowAuthMW{}, false)
	r := chi.NewRouter()
	h.RegisterRoutes(r)

	req := httptest.NewRequest(http.MethodPost, "/auth/dev-login", nil)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, rr.Code)
	}
}

func TestHandler_AuthConfig_ReturnsDevLoginFlag(t *testing.T) {
	t.Run("enabled", func(t *testing.T) {
		h := NewHandler(nil, allowAuthMW{}, true)
		r := chi.NewRouter()
		h.RegisterRoutes(r)

		req := httptest.NewRequest(http.MethodGet, "/auth/config", nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
		}
		var body map[string]bool
		if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if !body["dev_login_enabled"] {
			t.Fatalf("expected dev_login_enabled=true")
		}
	})

	t.Run("disabled", func(t *testing.T) {
		h := NewHandler(nil, allowAuthMW{}, false)
		r := chi.NewRouter()
		h.RegisterRoutes(r)

		req := httptest.NewRequest(http.MethodGet, "/auth/config", nil)
		rr := httptest.NewRecorder()

		r.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
		}
		var body map[string]bool
		if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if body["dev_login_enabled"] {
			t.Fatalf("expected dev_login_enabled=false")
		}
	})
}
