package application

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/billing/domain"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/billing/ports"
	"github.com/stripe/stripe-go/v76"
	checkoutsession "github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/webhook"
)

type Service struct {
	repo            ports.SubscriptionRepository
	stripeSecretKey string
	webhookSecret   string
	// priceID → Plan mapping (built from the 4 configured price IDs)
	priceToplan map[string]domain.Plan
}

func NewService(
	repo ports.SubscriptionRepository,
	stripeSecretKey, webhookSecret string,
	priceProMonthly, priceProYearly string,
	priceEliteMonthly, priceEliteYearly string,
) *Service {
	priceToplan := map[string]domain.Plan{}
	if priceProMonthly != "" {
		priceToplan[priceProMonthly] = domain.PlanPro
	}
	if priceProYearly != "" {
		priceToplan[priceProYearly] = domain.PlanPro
	}
	if priceEliteMonthly != "" {
		priceToplan[priceEliteMonthly] = domain.PlanElite
	}
	if priceEliteYearly != "" {
		priceToplan[priceEliteYearly] = domain.PlanElite
	}
	return &Service{
		repo:            repo,
		stripeSecretKey: stripeSecretKey,
		webhookSecret:   webhookSecret,
		priceToplan:     priceToplan,
	}
}

func (s *Service) CreateCheckoutSession(ctx context.Context, userID, priceID, successURL, cancelURL string) (string, error) {
	plan, ok := s.priceToplan[priceID]
	if !ok {
		return "", domain.ErrInvalidPlan
	}

	stripe.Key = s.stripeSecretKey

	params := &stripe.CheckoutSessionParams{
		Mode:              stripe.String("subscription"),
		SuccessURL:        stripe.String(successURL),
		CancelURL:         stripe.String(cancelURL),
		ClientReferenceID: stripe.String(userID),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
	}
	// Embed the target plan in session metadata so the webhook can read it
	// without needing to expand line_items.
	params.AddMetadata("plan", string(plan))
	params.Context = ctx

	sess, err := checkoutsession.New(params)
	if err != nil {
		return "", fmt.Errorf("%w: %v", domain.ErrCheckoutFailed, err)
	}
	if sess == nil || sess.URL == "" {
		return "", domain.ErrCheckoutFailed
	}
	return sess.URL, nil
}

func (s *Service) HandleWebhook(ctx context.Context, payload []byte, sigHeader string) error {
	event, err := webhook.ConstructEvent(payload, sigHeader, s.webhookSecret)
	if err != nil {
		return domain.ErrWebhookInvalid
	}
	return s.handleEvent(ctx, event)
}

func (s *Service) handleEvent(ctx context.Context, event stripe.Event) error {
	switch event.Type {
	case "checkout.session.completed":
		var body map[string]any
		if err := json.Unmarshal(event.Data.Raw, &body); err != nil {
			return nil
		}

		userID := getString(body, "client_reference_id")
		customerID := getString(body, "customer")
		subscriptionID := getString(body, "subscription")
		if strings.TrimSpace(userID) == "" {
			return nil
		}

		// Determine plan from session metadata (set when creating the session).
		// Fall back to the priceToplan map if metadata is absent.
		plan := s.resolvePlanFromSession(body)

		return s.repo.UpdateUserPlan(ctx, userID, plan, customerID, subscriptionID, nil)

	case "customer.subscription.deleted":
		var body map[string]any
		if err := json.Unmarshal(event.Data.Raw, &body); err != nil {
			return nil
		}
		customerID := getString(body, "customer")
		if strings.TrimSpace(customerID) == "" {
			return nil
		}

		userID, err := s.repo.GetUserByStripeCustomerID(ctx, customerID)
		if err != nil {
			if err == pgx.ErrNoRows {
				return nil
			}
			return err
		}
		return s.repo.UpdateUserPlan(ctx, userID, domain.PlanFree, customerID, "", nil)

	default:
		return nil
	}
}

// resolvePlanFromSession reads "metadata.plan" from the checkout session body.
// If absent or invalid, it falls back to PlanPro for backward compatibility.
func (s *Service) resolvePlanFromSession(body map[string]any) domain.Plan {
	if meta, ok := body["metadata"].(map[string]any); ok {
		if planStr, ok := meta["plan"].(string); ok {
			switch domain.Plan(planStr) {
			case domain.PlanPro, domain.PlanElite:
				return domain.Plan(planStr)
			}
		}
	}
	return domain.PlanPro
}

func (s *Service) GetUserPlan(ctx context.Context, userID string) (domain.Plan, error) {
	return s.repo.GetUserPlan(ctx, userID)
}

func (s *Service) IsAllowedPriceID(priceID string) bool {
	_, ok := s.priceToplan[priceID]
	return ok
}

func getString(values map[string]any, key string) string {
	raw, ok := values[key]
	if !ok || raw == nil {
		return ""
	}
	if str, ok := raw.(string); ok {
		return str
	}
	return ""
}
