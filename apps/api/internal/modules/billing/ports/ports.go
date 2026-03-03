package ports

import (
	"context"
	"time"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/billing/domain"
)

type SubscriptionRepository interface {
	GetUserPlan(ctx context.Context, userID string) (domain.Plan, error)
	UpdateUserPlan(ctx context.Context, userID string, plan domain.Plan, stripeCustomerID, stripeSubscriptionID string, expiresAt *time.Time) error
	GetUserByStripeCustomerID(ctx context.Context, stripeCustomerID string) (string, error)
}
