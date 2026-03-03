package http

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/billing/domain"
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

type fakeService struct {
	checkoutURL string
	checkoutErr error
	webhookErr  error
	plan        domain.Plan
	planErr     error

	allowPrice bool
}

func (f fakeService) CreateCheckoutSession(_ context.Context, _ string, _ string, _ string, _ string) (string, error) {
	return f.checkoutURL, f.checkoutErr
}

func (f fakeService) HandleWebhook(_ context.Context, _ []byte, _ string) error {
	return f.webhookErr
}

func (f fakeService) GetUserPlan(_ context.Context, _ string) (domain.Plan, error) {
	return f.plan, f.planErr
}

func (f fakeService) IsAllowedPriceID(_ string) bool {
	return f.allowPrice
}

func TestCheckout_OK(t *testing.T) {
	h := NewHandler(
		fakeService{
			checkoutURL: "https://checkout.stripe.com/c/pay/cs_test_123",
			allowPrice:  true,
		},
		allowAuthMW{},
		"https://app.example.com",
	)
	r := chi.NewRouter()
	h.RegisterRoutes(r)

	body := bytes.NewBufferString(`{"price_id":"price_valid_monthly"}`)
	req := httptest.NewRequest(http.MethodPost, "/billing/checkout", body)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	var payload map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["checkout_url"] != "https://checkout.stripe.com/c/pay/cs_test_123" {
		t.Fatalf("unexpected checkout_url: %q", payload["checkout_url"])
	}
}

func TestCheckout_Unauthenticated(t *testing.T) {
	h := NewHandler(fakeService{}, denyAuthMW{}, "https://app.example.com")
	r := chi.NewRouter()
	h.RegisterRoutes(r)

	body := bytes.NewBufferString(`{"price_id":"price_valid_monthly"}`)
	req := httptest.NewRequest(http.MethodPost, "/billing/checkout", body)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rr.Code)
	}
}

func TestCheckout_InvalidPriceID(t *testing.T) {
	h := NewHandler(
		fakeService{
			checkoutErr: domain.ErrInvalidPlan,
			allowPrice:  true,
		},
		allowAuthMW{},
		"https://app.example.com",
	)
	r := chi.NewRouter()
	h.RegisterRoutes(r)

	body := bytes.NewBufferString(`{"price_id":"price_invalid"}`)
	req := httptest.NewRequest(http.MethodPost, "/billing/checkout", body)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestWebhook_OK(t *testing.T) {
	h := NewHandler(fakeService{}, allowAuthMW{}, "https://app.example.com")
	r := chi.NewRouter()
	h.RegisterRoutes(r)

	req := httptest.NewRequest(http.MethodPost, "/webhooks/stripe", bytes.NewBufferString(`{"id":"evt_test"}`))
	req.Header.Set("Stripe-Signature", "t=123,v1=abc")
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}
}

func TestGetPlan_OK(t *testing.T) {
	h := NewHandler(
		fakeService{
			plan: domain.PlanPro,
		},
		allowAuthMW{},
		"https://app.example.com",
	)
	r := chi.NewRouter()
	h.RegisterRoutes(r)

	req := httptest.NewRequest(http.MethodGet, "/billing/plan", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rr.Code)
	}

	var payload map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["plan"] != "pro" {
		t.Fatalf("expected plan %q, got %q", "pro", payload["plan"])
	}
}

func TestGetPlan_Unauthenticated(t *testing.T) {
	h := NewHandler(fakeService{}, denyAuthMW{}, "https://app.example.com")
	r := chi.NewRouter()
	h.RegisterRoutes(r)

	req := httptest.NewRequest(http.MethodGet, "/billing/plan", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rr.Code)
	}
}

func TestCheckout_InvalidPlanFromService_IsBadRequest(t *testing.T) {
	h := NewHandler(
		fakeService{
			checkoutErr: errors.New(domain.ErrInvalidPlan.Error()),
			allowPrice:  true,
		},
		allowAuthMW{},
		"https://app.example.com",
	)
	r := chi.NewRouter()
	h.RegisterRoutes(r)

	body := bytes.NewBufferString(`{"price_id":"price_valid_monthly"}`)
	req := httptest.NewRequest(http.MethodPost, "/billing/checkout", body)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}
