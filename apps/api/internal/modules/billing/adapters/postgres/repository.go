package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/billing/domain"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) GetUserPlan(ctx context.Context, userID string) (domain.Plan, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return "", fmt.Errorf("parse user id: %w", err)
	}

	const q = `SELECT plan FROM users WHERE id = $1`

	var plan string
	if err := r.pool.QueryRow(ctx, q, uid).Scan(&plan); err != nil {
		return "", fmt.Errorf("query user plan: %w", err)
	}

	switch domain.Plan(plan) {
	case domain.PlanFree, domain.PlanPro, domain.PlanElite:
		return domain.Plan(plan), nil
	default:
		return "", domain.ErrInvalidPlan
	}
}

func (r *Repository) UpdateUserPlan(
	ctx context.Context,
	userID string,
	plan domain.Plan,
	stripeCustomerID, stripeSubscriptionID string,
	expiresAt *time.Time,
) error {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("parse user id: %w", err)
	}

	const q = `
UPDATE users
SET
	plan = $2,
	stripe_customer_id = $3,
	stripe_subscription_id = $4,
	plan_expires_at = $5
WHERE id = $1`

	if _, err := r.pool.Exec(ctx, q, uid, string(plan), stripeCustomerID, stripeSubscriptionID, expiresAt); err != nil {
		return fmt.Errorf("update user plan: %w", err)
	}
	return nil
}

func (r *Repository) GetUserByStripeCustomerID(ctx context.Context, stripeCustomerID string) (string, error) {
	const q = `SELECT id FROM users WHERE stripe_customer_id = $1`

	var userID uuid.UUID
	if err := r.pool.QueryRow(ctx, q, stripeCustomerID).Scan(&userID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", pgx.ErrNoRows
		}
		return "", fmt.Errorf("query user by stripe customer id: %w", err)
	}
	return userID.String(), nil
}
