package postgres

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/domain"
)

var ErrInvalidEAToken = errors.New("invalid ea token")

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

func (r *Repository) ListTrades(ctx context.Context, accountID string, limit, offset int) ([]domain.Trade, error) {
	uid, err := uuid.Parse(accountID)
	if err != nil {
		log.Printf("[mt5/repo] list trades error: parse account_id %q: %v", accountID, err)
		return nil, fmt.Errorf("parse account id: %w", err)
	}

	const q = `
SELECT
	id, account_id, ticket, symbol, side, volume,
	open_price, close_price, opened_at, closed_at,
	commission, swap, profit, comment, source_hash, imported_at
FROM mt5_trades
WHERE account_id = $1
ORDER BY opened_at DESC
LIMIT $2 OFFSET $3`

	rows, err := r.pool.Query(ctx, q, uid, limit, offset)
	if err != nil {
		log.Printf("[mt5/repo] list trades error: query: %v", err)
		return nil, fmt.Errorf("query trades: %w", err)
	}
	defer rows.Close()

	trades := make([]domain.Trade, 0, limit)
	for rows.Next() {
		var trade domain.Trade
		var tradeID int64        // id column is BIGINT (serial), not UUID
		var tradeAccountID uuid.UUID
		if err := rows.Scan(
			&tradeID,
			&tradeAccountID,
			&trade.Ticket,
			&trade.Symbol,
			&trade.Side,
			&trade.Volume,
			&trade.OpenPrice,
			&trade.ClosePrice,
			&trade.OpenedAt,
			&trade.ClosedAt,
			&trade.Commission,
			&trade.Swap,
			&trade.Profit,
			&trade.Comment,
			&trade.SourceHash,
			&trade.ImportedAt,
		); err != nil {
			log.Printf("[mt5/repo] list trades error: scan row: %v", err)
			return nil, fmt.Errorf("scan trade row: %w", err)
		}
		trade.ID = fmt.Sprintf("%d", tradeID)
		trade.AccountID = tradeAccountID.String()
		trades = append(trades, trade)
	}
	if err := rows.Err(); err != nil {
		log.Printf("[mt5/repo] list trades error: rows iteration: %v", err)
		return nil, fmt.Errorf("iterate trade rows: %w", err)
	}

	return trades, nil
}

func (r *Repository) GetOrCreateEAToken(ctx context.Context, userID string) (string, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return "", fmt.Errorf("parse user id: %w", err)
	}

	var existing *string
	err = r.pool.QueryRow(ctx, `SELECT ea_token FROM users WHERE id = $1`, uid).Scan(&existing)
	if err != nil {
		return "", fmt.Errorf("query ea token: %w", err)
	}
	if existing != nil && *existing != "" {
		return *existing, nil
	}

	token, err := generateToken()
	if err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	_, err = r.pool.Exec(ctx, `UPDATE users SET ea_token = $1 WHERE id = $2`, token, uid)
	if err != nil {
		return "", fmt.Errorf("save ea token: %w", err)
	}
	return token, nil
}

func (r *Repository) GetUserByEAToken(ctx context.Context, token string) (string, error) {
	var userID uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT id FROM users WHERE ea_token = $1`, token).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrInvalidEAToken
	}
	if err != nil {
		return "", fmt.Errorf("query user by ea token: %w", err)
	}
	return userID.String(), nil
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
