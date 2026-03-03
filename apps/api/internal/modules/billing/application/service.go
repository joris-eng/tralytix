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
	priceMonthly    string
	priceYearly     string
}

func NewService(
	repo ports.SubscriptionRepository,
	stripeSecretKey, webhookSecret, priceMonthly, priceYearly string,
) *Service {
	return &Service{
		repo:            repo,
		stripeSecretKey: stripeSecretKey,
		webhookSecret:   webhookSecret,
		priceMonthly:    priceMonthly,
		priceYearly:     priceYearly,
	}
}

func (s *Service) CreateCheckoutSession(ctx context.Context, userID, priceID, successURL, cancelURL string) (string, error) {
	if !s.IsAllowedPriceID(priceID) {
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
		return s.repo.UpdateUserPlan(ctx, userID, domain.PlanPro, customerID, subscriptionID, nil)

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

func (s *Service) GetUserPlan(ctx context.Context, userID string) (domain.Plan, error) {
	return s.repo.GetUserPlan(ctx, userID)
}

func (s *Service) IsAllowedPriceID(priceID string) bool {
	return priceID == s.priceMonthly || priceID == s.priceYearly
}

func (s *Service) PriceMonthly() string {
	return s.priceMonthly
}

func (s *Service) PriceYearly() string {
	return s.priceYearly
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
