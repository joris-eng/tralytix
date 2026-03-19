package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/review/domain"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ListTrades(ctx context.Context, userID string) ([]domain.TradeWithReview, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("parse user id: %w", err)
	}

	// Join mt5_trades with trade_reviews using the account linked to this user.
	const q = `
SELECT
    t.id,
    t.symbol,
    t.side,
    t.profit,
    t.entry_price,
    t.close_price,
    t.open_time,
    t.close_time,
    r.id,
    r.rating,
    r.setup_tag,
    r.notes,
    r.key_learnings,
    r.reviewed_at,
    r.updated_at
FROM mt5_trades t
JOIN mt5_accounts a ON a.id = t.account_id
LEFT JOIN trade_reviews r ON r.trade_id = t.id AND r.user_id = $1
WHERE a.user_id = $1
ORDER BY t.close_time DESC
LIMIT 500`

	rows, err := r.pool.Query(ctx, q, uid)
	if err != nil {
		return nil, fmt.Errorf("list trades with reviews: %w", err)
	}
	defer rows.Close()

	var result []domain.TradeWithReview
	for rows.Next() {
		twr, err := scanTradeWithReview(rows)
		if err != nil {
			return nil, fmt.Errorf("scan trade with review: %w", err)
		}
		result = append(result, twr)
	}
	return result, rows.Err()
}

func (r *Repository) Upsert(ctx context.Context, rev domain.Review) (domain.Review, error) {
	uid, err := uuid.Parse(rev.UserID)
	if err != nil {
		return domain.Review{}, domain.ErrUnauthorized
	}

	const q = `
INSERT INTO trade_reviews (user_id, trade_id, rating, setup_tag, notes, key_learnings)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (user_id, trade_id) DO UPDATE SET
    rating        = EXCLUDED.rating,
    setup_tag     = EXCLUDED.setup_tag,
    notes         = EXCLUDED.notes,
    key_learnings = EXCLUDED.key_learnings,
    updated_at    = NOW()
RETURNING id, reviewed_at, updated_at`

	var id uuid.UUID
	var reviewedAt, updatedAt time.Time
	err = r.pool.QueryRow(ctx, q,
		uid, rev.TradeID, rev.Rating, rev.SetupTag, rev.Notes, rev.KeyLearnings,
	).Scan(&id, &reviewedAt, &updatedAt)
	if err != nil {
		return domain.Review{}, fmt.Errorf("upsert review: %w", err)
	}

	rev.ID = id.String()
	rev.ReviewedAt = reviewedAt
	rev.UpdatedAt = updatedAt
	return rev, nil
}

func (r *Repository) Get(ctx context.Context, userID string, tradeID int64) (domain.Review, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return domain.Review{}, domain.ErrUnauthorized
	}

	const q = `
SELECT id, user_id, trade_id, rating, setup_tag, notes, key_learnings, reviewed_at, updated_at
FROM trade_reviews
WHERE user_id = $1 AND trade_id = $2`

	row := r.pool.QueryRow(ctx, q, uid, tradeID)
	rev, err := scanReview(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Review{}, domain.ErrNotFound
	}
	return rev, err
}

func (r *Repository) Delete(ctx context.Context, userID string, tradeID int64) error {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return domain.ErrUnauthorized
	}

	cmd, err := r.pool.Exec(ctx,
		`DELETE FROM trade_reviews WHERE user_id=$1 AND trade_id=$2`, uid, tradeID,
	)
	if err != nil {
		return fmt.Errorf("delete review: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// ---- scanners ----

type rowScanner interface {
	Scan(dest ...any) error
}

func scanReview(s rowScanner) (domain.Review, error) {
	var rev domain.Review
	var id, userID uuid.UUID
	if err := s.Scan(
		&id, &userID, &rev.TradeID,
		&rev.Rating, &rev.SetupTag, &rev.Notes, &rev.KeyLearnings,
		&rev.ReviewedAt, &rev.UpdatedAt,
	); err != nil {
		return domain.Review{}, err
	}
	rev.ID = id.String()
	rev.UserID = userID.String()
	return rev, nil
}

func scanTradeWithReview(rows pgx.Rows) (domain.TradeWithReview, error) {
	var twr domain.TradeWithReview

	// review fields (nullable from LEFT JOIN)
	var revID *uuid.UUID
	var rating *int16
	var setupTag, notes *string
	var keyLearnings []string
	var reviewedAt, updatedAt *time.Time

	if err := rows.Scan(
		&twr.TradeID, &twr.Symbol, &twr.Side,
		&twr.Profit, &twr.EntryPrice, &twr.ClosePrice,
		&twr.OpenedAt, &twr.ClosedAt,
		&revID, &rating, &setupTag, &notes, &keyLearnings,
		&reviewedAt, &updatedAt,
	); err != nil {
		return domain.TradeWithReview{}, err
	}

	if revID != nil {
		rev := &domain.Review{
			ID:           revID.String(),
			UserID:       "",
			TradeID:      twr.TradeID,
			Rating:       int(*rating),
			SetupTag:     deref(setupTag),
			Notes:        deref(notes),
			KeyLearnings: keyLearnings,
			ReviewedAt:   derefTime(reviewedAt),
			UpdatedAt:    derefTime(updatedAt),
		}
		if rev.KeyLearnings == nil {
			rev.KeyLearnings = []string{}
		}
		twr.Review = rev
	}

	return twr, nil
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func derefTime(t *time.Time) time.Time {
	if t == nil {
		return time.Time{}
	}
	return *t
}
