package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/billing/domain"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
)

type fakePlanRepo struct {
	plan domain.Plan
	err  error
}

func (f fakePlanRepo) GetUserPlan(_ context.Context, _ string) (domain.Plan, error) {
	return f.plan, f.err
}

func (f fakePlanRepo) UpdateUserPlan(_ context.Context, _ string, _ domain.Plan, _, _ string, _ *time.Time) error {
	return nil
}

func (f fakePlanRepo) GetUserByStripeCustomerID(_ context.Context, _ string) (string, error) {
	return "", nil
}

func TestRequirePlan_FreeUser_Returns403(t *testing.T) {
	repo := fakePlanRepo{plan: domain.PlanFree}
	mw := RequirePlan(repo, domain.PlanPro)

	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/pro", nil)
	req = req.WithContext(authctx.WithAuthUserID(req.Context(), "user-1"))
	rr := httptest.NewRecorder()

	mw(next).ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, rr.Code)
	}

	var payload map[string]any
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	errBody, ok := payload["error"].(map[string]any)
	if !ok {
		t.Fatalf("expected nested error object in response")
	}
	if errBody["code"] != "pro_required" {
		t.Fatalf("expected code=pro_required, got %v", errBody["code"])
	}
}

func TestRequirePlan_ProUser_PassesThrough(t *testing.T) {
	repo := fakePlanRepo{plan: domain.PlanPro}
	mw := RequirePlan(repo, domain.PlanPro)

	nextCalled := false
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/pro", nil)
	req = req.WithContext(authctx.WithAuthUserID(req.Context(), "user-1"))
	rr := httptest.NewRecorder()

	mw(next).ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}
	if !nextCalled {
		t.Fatalf("expected next handler to be called")
	}
}

func TestRequirePlan_NoAuth_Returns401(t *testing.T) {
	repo := fakePlanRepo{plan: domain.PlanPro}
	mw := RequirePlan(repo, domain.PlanPro)

	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/pro", nil)
	rr := httptest.NewRecorder()

	mw(next).ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rr.Code)
	}
}
