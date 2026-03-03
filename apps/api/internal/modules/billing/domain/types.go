package domain

import (
	"errors"
	"time"
)

type Plan string

const (
	PlanFree Plan = "free"
	PlanPro  Plan = "pro"
)

type Subscription struct {
	UserID               string
	Plan                 Plan
	StripeCustomerID     string
	StripeSubscriptionID string
	PlanExpiresAt        *time.Time
}

var (
	ErrInvalidPlan    = errors.New("invalid plan")
	ErrCheckoutFailed = errors.New("checkout session creation failed")
	ErrWebhookInvalid = errors.New("invalid webhook signature")
)
