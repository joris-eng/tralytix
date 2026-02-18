package postgres

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/domain"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) SaveImportedTrades(ctx context.Context, trades []domain.Trade) (int, error) {
	if len(trades) == 0 {
		return 0, nil
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	const insertMT5Trade = `
INSERT INTO mt5_trades (
	account_id,
	ticket,
	symbol,
	side,
	volume,
	open_price,
	close_price,
	opened_at,
	closed_at,
	commission,
	swap,
	profit,
	comment,
	source_hash,
	imported_at
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
ON CONFLICT (account_id, source_hash) DO NOTHING`

	inserted := 0
	for _, t := range trades {
		accountID, err := uuid.Parse(t.AccountID)
		if err != nil {
			return 0, fmt.Errorf("parse account id: %w", err)
		}
		cmd, err := tx.Exec(
			ctx,
			insertMT5Trade,
			accountID,
			t.Ticket,
			t.Symbol,
			t.Side,
			t.Volume,
			t.OpenPrice,
			t.ClosePrice,
			t.OpenedAt,
			t.ClosedAt,
			t.Commission,
			t.Swap,
			t.Profit,
			t.Comment,
			t.SourceHash,
			t.ImportedAt,
		)
		if err != nil {
			return 0, fmt.Errorf("insert mt5 trade: %w", err)
		}
		inserted += int(cmd.RowsAffected())
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("commit tx: %w", err)
	}
	return inserted, nil
}

func (r *Repository) GetAccountSnapshot(ctx context.Context, accountID string) (domain.AccountSnapshot, error) {
	uid, err := uuid.Parse(accountID)
	if err != nil {
		return domain.AccountSnapshot{}, fmt.Errorf("parse account id: %w", err)
	}

	const q = `
SELECT
	COUNT(*)::bigint AS total_trades,
	MAX(imported_at) AS last_imported_at
FROM mt5_trades
WHERE account_id = $1`

	var snap domain.AccountSnapshot
	snap.AccountID = accountID
	if err := r.pool.QueryRow(ctx, q, uid).Scan(&snap.TotalTrades, &snap.LastImportedAt); err != nil {
		return domain.AccountSnapshot{}, fmt.Errorf("query account snapshot: %w", err)
	}
	if snap.TotalTrades == 0 {
		snap.LastImportStatus = "idle"
	} else {
		snap.LastImportStatus = "ok"
	}
	return snap, nil
}
