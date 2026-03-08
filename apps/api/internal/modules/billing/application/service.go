package application

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
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
	svc := &Service{
		repo:            repo,
		stripeSecretKey: stripeSecretKey,
		webhookSecret:   webhookSecret,
		priceToplan:     priceToplan,
	}

	// Log loaded price mappings at startup so Render logs show the config state.
	if len(priceToplan) == 0 {
		log.Printf("[billing] WARNING: no Stripe price IDs configured — checkout and webhook plan resolution will fail")
	} else {
		log.Printf("[billing] loaded %d price ID mapping(s):", len(priceToplan))
		for priceID, plan := range priceToplan {
			log.Printf("[billing]   price_id=%s → plan=%s", priceID, plan)
		}
	}
	if webhookSecret == "" {
		log.Printf("[billing] WARNING: STRIPE_WEBHOOK_SECRET is empty — webhook signature verification will always fail")
	}

	return svc
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
	event, err := webhook.ConstructEventWithOptions(payload, sigHeader, s.webhookSecret,
		webhook.ConstructEventOptions{
			IgnoreAPIVersionMismatch: true, // Stripe dashboard may run an older API version than the SDK expects
		})
	if err != nil {
		log.Printf("[billing/webhook] signature verification failed: %v (sig_header_len=%d, secret_set=%v)",
			err, len(sigHeader), s.webhookSecret != "")
		return domain.ErrWebhookInvalid
	}
	log.Printf("[billing/webhook] verified event id=%s type=%s", event.ID, event.Type)
	return s.handleEvent(ctx, event)
}

func (s *Service) handleEvent(ctx context.Context, event stripe.Event) error {
	switch event.Type {
	case "checkout.session.completed":
		var body map[string]any
		if err := json.Unmarshal(event.Data.Raw, &body); err != nil {
			log.Printf("[billing/webhook] checkout.session.completed: failed to unmarshal body: %v", err)
			return nil
		}

		userID := getString(body, "client_reference_id")
		customerID := getString(body, "customer")
		subscriptionID := getString(body, "subscription")

		log.Printf("[billing/webhook] checkout.session.completed: userID=%q customerID=%q subscriptionID=%q",
			userID, customerID, subscriptionID)

		if strings.TrimSpace(userID) == "" {
			log.Printf("[billing/webhook] checkout.session.completed: skipping — client_reference_id is empty")
			return nil
		}

		// Determine plan from session metadata (set when creating the session).
		// Fall back to PlanPro for backward compatibility.
		plan := s.resolvePlanFromSession(body)
		log.Printf("[billing/webhook] checkout.session.completed: resolved plan=%s — calling UpdateUserPlan", plan)

		if err := s.repo.UpdateUserPlan(ctx, userID, plan, customerID, subscriptionID, nil); err != nil {
			log.Printf("[billing/webhook] checkout.session.completed: UpdateUserPlan failed: %v", err)
			return err
		}
		log.Printf("[billing/webhook] checkout.session.completed: plan updated to %s for userID=%s", plan, userID)
		return nil

	case "customer.subscription.deleted":
		var body map[string]any
		if err := json.Unmarshal(event.Data.Raw, &body); err != nil {
			log.Printf("[billing/webhook] customer.subscription.deleted: failed to unmarshal body: %v", err)
			return nil
		}
		customerID := getString(body, "customer")
		log.Printf("[billing/webhook] customer.subscription.deleted: customerID=%q", customerID)

		if strings.TrimSpace(customerID) == "" {
			log.Printf("[billing/webhook] customer.subscription.deleted: skipping — customer ID is empty")
			return nil
		}

		userID, err := s.repo.GetUserByStripeCustomerID(ctx, customerID)
		if err != nil {
			if err == pgx.ErrNoRows {
				log.Printf("[billing/webhook] customer.subscription.deleted: no user found for customerID=%s", customerID)
				return nil
			}
			log.Printf("[billing/webhook] customer.subscription.deleted: GetUserByStripeCustomerID error: %v", err)
			return err
		}

		log.Printf("[billing/webhook] customer.subscription.deleted: downgrading userID=%s to free", userID)
		if err := s.repo.UpdateUserPlan(ctx, userID, domain.PlanFree, customerID, "", nil); err != nil {
			log.Printf("[billing/webhook] customer.subscription.deleted: UpdateUserPlan failed: %v", err)
			return err
		}
		log.Printf("[billing/webhook] customer.subscription.deleted: plan reset to free for userID=%s", userID)
		return nil

	default:
		log.Printf("[billing/webhook] unhandled event type=%s — ignoring", event.Type)
		return nil
	}
}

// resolvePlanFromSession reads "metadata.plan" from the checkout session body.
// If absent or invalid, it falls back to PlanPro for backward compatibility.
func (s *Service) resolvePlanFromSession(body map[string]any) domain.Plan {
	meta, hasMeta := body["metadata"].(map[string]any)
	if !hasMeta {
		log.Printf("[billing/webhook] resolvePlan: no metadata field — falling back to pro")
		return domain.PlanPro
	}
	planStr, hasKey := meta["plan"].(string)
	if !hasKey || planStr == "" {
		log.Printf("[billing/webhook] resolvePlan: metadata.plan absent or empty — falling back to pro (meta keys: %v)", metaKeys(meta))
		return domain.PlanPro
	}
	switch domain.Plan(planStr) {
	case domain.PlanPro, domain.PlanElite:
		log.Printf("[billing/webhook] resolvePlan: metadata.plan=%s", planStr)
		return domain.Plan(planStr)
	default:
		log.Printf("[billing/webhook] resolvePlan: unrecognised metadata.plan=%q — falling back to pro", planStr)
		return domain.PlanPro
	}
}

func metaKeys(m map[string]any) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
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
