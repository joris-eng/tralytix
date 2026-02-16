package db

import (
	"context"
	"time"
)

type CreateSessionParams struct {
	ID        string
	UserID    string
	TokenHash string
	ExpiresAt time.Time
}

const createSession = `-- name: CreateSession :one
INSERT INTO sessions (id, user_id, token_hash, expires_at)
VALUES ($1, $2, $3, $4)
RETURNING id, user_id, token_hash, expires_at, created_at
`

func (q *Queries) CreateSession(ctx context.Context, arg CreateSessionParams) (Session, error) {
	row := q.db.QueryRow(ctx, createSession, arg.ID, arg.UserID, arg.TokenHash, arg.ExpiresAt)
	var s Session
	err := row.Scan(&s.ID, &s.UserID, &s.TokenHash, &s.ExpiresAt, &s.CreatedAt)
	return s, err
}

const getSessionByTokenHash = `-- name: GetSessionByTokenHash :one
SELECT id, user_id, token_hash, expires_at, created_at
FROM sessions
WHERE token_hash = $1
`

func (q *Queries) GetSessionByTokenHash(ctx context.Context, tokenHash string) (Session, error) {
	row := q.db.QueryRow(ctx, getSessionByTokenHash, tokenHash)
	var s Session
	err := row.Scan(&s.ID, &s.UserID, &s.TokenHash, &s.ExpiresAt, &s.CreatedAt)
	return s, err
}
