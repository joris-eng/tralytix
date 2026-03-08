package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/billing/domain"
	"github.com/stripe/stripe-go/v76"
)

// ---- helpers ----------------------------------------------------------------

const (
	testProMonthly   = "price_pro_monthly"
	testProYearly    = "price_pro_yearly"
	testEliteMonthly = "price_elite_monthly"
	testEliteYearly  = "price_elite_yearly"
)

func newTestService(repo *fakeRepo) *Service {
	return NewService(
		repo,
		"sk_test_x",
		"whsec_test",
		testProMonthly,
		testProYearly,
		testEliteMonthly,
		testEliteYearly,
	)
}

// ---- fake repo --------------------------------------------------------------

type fakeRepo struct {
	planResult                 domain.Plan
	userIDByStripeCustomerID   string
	getPlanErr                 error
	getUserByStripeCustomerErr error
	updateErr                  error

	updateCalled         bool
	updateUserID         string
	updatePlan           domain.Plan
	updateCustomerID     string
	updateSubscriptionID string
	updateExpiresAt      *time.Time
}

func (f *fakeRepo) GetUserPlan(_ context.Context, _ string) (domain.Plan, error) {
	if f.getPlanErr != nil {
		return "", f.getPlanErr
	}
	return f.planResult, nil
}

func (f *fakeRepo) UpdateUserPlan(
	_ context.Context,
	userID string,
	plan domain.Plan,
	stripeCustomerID, stripeSubscriptionID string,
	expiresAt *time.Time,
) error {
	f.updateCalled = true
	f.updateUserID = userID
	f.updatePlan = plan
	f.updateCustomerID = stripeCustomerID
	f.updateSubscriptionID = stripeSubscriptionID
	f.updateExpiresAt = expiresAt
	return f.updateErr
}

func (f *fakeRepo) GetUserByStripeCustomerID(_ context.Context, _ string) (string, error) {
	if f.getUserByStripeCustomerErr != nil {
		return "", f.getUserByStripeCustomerErr
	}
	return f.userIDByStripeCustomerID, nil
}

// ---- tests ------------------------------------------------------------------

func TestGetUserPlan_ReturnsFree(t *testing.T) {
	repo := &fakeRepo{planResult: domain.PlanFree}
	svc := newTestService(repo)

	plan, err := svc.GetUserPlan(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("GetUserPlan() unexpected error: %v", err)
	}
	if plan != domain.PlanFree {
		t.Fatalf("plan = %q, want %q", plan, domain.PlanFree)
	}
}

func TestGetUserPlan_ReturnsPro(t *testing.T) {
	repo := &fakeRepo{planResult: domain.PlanPro}
	svc := newTestService(repo)

	plan, err := svc.GetUserPlan(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("GetUserPlan() unexpected error: %v", err)
	}
	if plan != domain.PlanPro {
		t.Fatalf("plan = %q, want %q", plan, domain.PlanPro)
	}
}

func TestCreateCheckoutSession_InvalidPriceID(t *testing.T) {
	repo := &fakeRepo{}
	svc := newTestService(repo)

	_, err := svc.CreateCheckoutSession(
		context.Background(),
		"user-1",
		"price_invalid",
		"https://example.com/success",
		"https://example.com/cancel",
	)
	if err == nil {
		t.Fatalf("CreateCheckoutSession() expected error, got nil")
	}
	if !errors.Is(err, domain.ErrInvalidPlan) {
		t.Fatalf("expected ErrInvalidPlan, got %v", err)
	}
}

func TestIsAllowedPriceID(t *testing.T) {
	repo := &fakeRepo{}
	svc := newTestService(repo)

	cases := []struct {
		priceID string
		allowed bool
	}{
		{testProMonthly, true},
		{testProYearly, true},
		{testEliteMonthly, true},
		{testEliteYearly, true},
		{"price_unknown", false},
		{"", false},
	}

	for _, tc := range cases {
		got := svc.IsAllowedPriceID(tc.priceID)
		if got != tc.allowed {
			t.Errorf("IsAllowedPriceID(%q) = %v, want %v", tc.priceID, got, tc.allowed)
		}
	}
}

func TestHandleWebhook_InvalidSignature(t *testing.T) {
	repo := &fakeRepo{}
	svc := newTestService(repo)

	err := svc.HandleWebhook(context.Background(), []byte("garbage"), "bad_signature")
	if !errors.Is(err, domain.ErrWebhookInvalid) {
		t.Fatalf("expected ErrWebhookInvalid, got %v", err)
	}
}

func TestHandleWebhook_CheckoutCompleted_UpgradesToPro(t *testing.T) {
	repo := &fakeRepo{}
	svc := newTestService(repo)

	// Session with metadata.plan = "pro"
	event := stripe.Event{
		Type: "checkout.session.completed",
		Data: &stripe.EventData{
			Raw: []byte(`{
				"client_reference_id": "user-123",
				"customer": "cus_123",
				"subscription": "sub_123",
				"metadata": {"plan": "pro"}
			}`),
		},
	}

	err := svc.handleEvent(context.Background(), event)
	if err != nil {
		t.Fatalf("handleEvent() unexpected error: %v", err)
	}
	if !repo.updateCalled {
		t.Fatalf("expected UpdateUserPlan to be called")
	}
	if repo.updateUserID != "user-123" {
		t.Fatalf("update userID = %q, want %q", repo.updateUserID, "user-123")
	}
	if repo.updatePlan != domain.PlanPro {
		t.Fatalf("update plan = %q, want %q", repo.updatePlan, domain.PlanPro)
	}
	if repo.updateCustomerID != "cus_123" {
		t.Fatalf("update customerID = %q, want %q", repo.updateCustomerID, "cus_123")
	}
	if repo.updateSubscriptionID != "sub_123" {
		t.Fatalf("update subscriptionID = %q, want %q", repo.updateSubscriptionID, "sub_123")
	}
}

func TestHandleWebhook_CheckoutCompleted_UpgradesToElite(t *testing.T) {
	repo := &fakeRepo{}
	svc := newTestService(repo)

	// Session with metadata.plan = "elite"
	event := stripe.Event{
		Type: "checkout.session.completed",
		Data: &stripe.EventData{
			Raw: []byte(`{
				"client_reference_id": "user-456",
				"customer": "cus_456",
				"subscription": "sub_456",
				"metadata": {"plan": "elite"}
			}`),
		},
	}

	err := svc.handleEvent(context.Background(), event)
	if err != nil {
		t.Fatalf("handleEvent() unexpected error: %v", err)
	}
	if !repo.updateCalled {
		t.Fatalf("expected UpdateUserPlan to be called")
	}
	if repo.updatePlan != domain.PlanElite {
		t.Fatalf("update plan = %q, want %q", repo.updatePlan, domain.PlanElite)
	}
}

func TestHandleWebhook_CheckoutCompleted_NoMetadataFallsToPro(t *testing.T) {
	repo := &fakeRepo{}
	svc := newTestService(repo)

	// Session without metadata → fallback to PlanPro
	event := stripe.Event{
		Type: "checkout.session.completed",
		Data: &stripe.EventData{
			Raw: []byte(`{
				"client_reference_id": "user-789",
				"customer": "cus_789",
				"subscription": "sub_789"
			}`),
		},
	}

	err := svc.handleEvent(context.Background(), event)
	if err != nil {
		t.Fatalf("handleEvent() unexpected error: %v", err)
	}
	if repo.updatePlan != domain.PlanPro {
		t.Fatalf("update plan = %q, want %q (fallback)", repo.updatePlan, domain.PlanPro)
	}
}

func TestHandleWebhook_SubscriptionDeleted_DowngradesToFree(t *testing.T) {
	repo := &fakeRepo{
		userIDByStripeCustomerID: "user-xyz",
	}
	svc := newTestService(repo)

	event := stripe.Event{
		Type: "customer.subscription.deleted",
		Data: &stripe.EventData{
			Raw: []byte(`{
				"customer": "cus_deleted_1"
			}`),
		},
	}

	err := svc.handleEvent(context.Background(), event)
	if err != nil {
		t.Fatalf("handleEvent() unexpected error: %v", err)
	}
	if !repo.updateCalled {
		t.Fatalf("expected UpdateUserPlan to be called")
	}
	if repo.updateUserID != "user-xyz" {
		t.Fatalf("update userID = %q, want %q", repo.updateUserID, "user-xyz")
	}
	if repo.updatePlan != domain.PlanFree {
		t.Fatalf("update plan = %q, want %q", repo.updatePlan, domain.PlanFree)
	}
	if repo.updateCustomerID != "cus_deleted_1" {
		t.Fatalf("update customerID = %q, want %q", repo.updateCustomerID, "cus_deleted_1")
	}
	if repo.updateSubscriptionID != "" {
		t.Fatalf("update subscriptionID = %q, want empty", repo.updateSubscriptionID)
	}
}
