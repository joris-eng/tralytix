package ports

import (
	"context"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/review/domain"
)

type Repository interface {
	// ListTrades returns all MT5 trades for userID joined with their review (if any).
	ListTrades(ctx context.Context, userID string) ([]domain.TradeWithReview, error)

	// Upsert creates or updates a review for a given trade.
	Upsert(ctx context.Context, review domain.Review) (domain.Review, error)

	// Get returns the review for a specific trade. Returns ErrNotFound if none.
	Get(ctx context.Context, userID string, tradeID int64) (domain.Review, error)

	// Delete removes the review for a specific trade.
	Delete(ctx context.Context, userID string, tradeID int64) error
}
