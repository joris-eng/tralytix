package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/journal/domain"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, entry domain.Entry) (domain.Entry, error) {
	userID, err := uuid.Parse(entry.UserID)
	if err != nil {
		return domain.Entry{}, fmt.Errorf("parse user id: %w", err)
	}

	const q = `
INSERT INTO trade_journal_entries
    (user_id, symbol, side, timeframe, entry_price, close_price, profit, opened_at, setup, emotions, notes, lessons)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
RETURNING id, created_at, updated_at`

	var id uuid.UUID
	var createdAt, updatedAt time.Time
	err = r.pool.QueryRow(ctx, q,
		userID, entry.Symbol, entry.Side, entry.Timeframe,
		entry.EntryPrice, entry.ClosePrice, entry.Profit,
		entry.OpenedAt.Format("2006-01-02"),
		entry.Setup, entry.Emotions, entry.Notes, entry.Lessons,
	).Scan(&id, &createdAt, &updatedAt)
	if err != nil {
		return domain.Entry{}, fmt.Errorf("insert journal entry: %w", err)
	}

	entry.ID = id.String()
	entry.CreatedAt = createdAt
	entry.UpdatedAt = updatedAt
	return entry, nil
}

func (r *Repository) List(ctx context.Context, userID string) ([]domain.Entry, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("parse user id: %w", err)
	}

	const q = `
SELECT id, user_id, symbol, side, timeframe, entry_price, close_price, profit,
       opened_at, setup, emotions, notes, lessons, created_at, updated_at
FROM trade_journal_entries
WHERE user_id = $1
ORDER BY opened_at DESC, created_at DESC`

	rows, err := r.pool.Query(ctx, q, uid)
	if err != nil {
		return nil, fmt.Errorf("list journal entries: %w", err)
	}
	defer rows.Close()

	var entries []domain.Entry
	for rows.Next() {
		e, err := scanEntry(rows)
		if err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

func (r *Repository) Get(ctx context.Context, id, userID string) (domain.Entry, error) {
	entryID, err := uuid.Parse(id)
	if err != nil {
		return domain.Entry{}, domain.ErrNotFound
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return domain.Entry{}, domain.ErrUnauthorized
	}

	const q = `
SELECT id, user_id, symbol, side, timeframe, entry_price, close_price, profit,
       opened_at, setup, emotions, notes, lessons, created_at, updated_at
FROM trade_journal_entries
WHERE id = $1 AND user_id = $2`

	row := r.pool.QueryRow(ctx, q, entryID, uid)
	e, err := scanEntry(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Entry{}, domain.ErrNotFound
	}
	return e, err
}

func (r *Repository) Update(ctx context.Context, entry domain.Entry) (domain.Entry, error) {
	entryID, err := uuid.Parse(entry.ID)
	if err != nil {
		return domain.Entry{}, domain.ErrNotFound
	}
	uid, err := uuid.Parse(entry.UserID)
	if err != nil {
		return domain.Entry{}, domain.ErrUnauthorized
	}

	const q = `
UPDATE trade_journal_entries
SET symbol=$3, side=$4, timeframe=$5, entry_price=$6, close_price=$7, profit=$8,
    opened_at=$9, setup=$10, emotions=$11, notes=$12, lessons=$13, updated_at=NOW()
WHERE id=$1 AND user_id=$2
RETURNING id, user_id, symbol, side, timeframe, entry_price, close_price, profit,
          opened_at, setup, emotions, notes, lessons, created_at, updated_at`

	row := r.pool.QueryRow(ctx, q,
		entryID, uid,
		entry.Symbol, entry.Side, entry.Timeframe,
		entry.EntryPrice, entry.ClosePrice, entry.Profit,
		entry.OpenedAt.Format("2006-01-02"),
		entry.Setup, entry.Emotions, entry.Notes, entry.Lessons,
	)
	updated, err := scanEntry(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Entry{}, domain.ErrNotFound
	}
	return updated, err
}

func (r *Repository) Delete(ctx context.Context, id, userID string) error {
	entryID, err := uuid.Parse(id)
	if err != nil {
		return domain.ErrNotFound
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return domain.ErrUnauthorized
	}

	cmd, err := r.pool.Exec(ctx,
		`DELETE FROM trade_journal_entries WHERE id=$1 AND user_id=$2`,
		entryID, uid,
	)
	if err != nil {
		return fmt.Errorf("delete journal entry: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type scanner interface {
	Scan(dest ...any) error
}

func scanEntry(s scanner) (domain.Entry, error) {
	var e domain.Entry
	var id, userID uuid.UUID
	var openedAt time.Time
	if err := s.Scan(
		&id, &userID, &e.Symbol, &e.Side, &e.Timeframe,
		&e.EntryPrice, &e.ClosePrice, &e.Profit,
		&openedAt, &e.Setup, &e.Emotions, &e.Notes, &e.Lessons,
		&e.CreatedAt, &e.UpdatedAt,
	); err != nil {
		return domain.Entry{}, err
	}
	e.ID = id.String()
	e.UserID = userID.String()
	e.OpenedAt = openedAt
	return e, nil
}
