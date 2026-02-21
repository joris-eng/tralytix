package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/identity/domain"
	identityusecase "github.com/joris-eng/tralytix/apps/api/internal/modules/identity/usecase"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/db"
)

type Repository struct {
	q *db.Queries
}

func NewRepository(q *db.Queries) *Repository {
	return &Repository{q: q}
}

func (r *Repository) GetByEmail(ctx context.Context, email string) (domain.User, error) {
	row, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, identityusecase.ErrUserNotFound
		}
		return domain.User{}, fmt.Errorf("query user by email: %w", err)
	}
	return domain.User{
		ID:        row.ID,
		Email:     row.Email,
		CreatedAt: row.CreatedAt,
	}, nil
}

func (r *Repository) CreateUser(ctx context.Context, email string) (domain.User, error) {
	row, err := r.q.CreateUser(ctx, db.CreateUserParams{
		ID:    uuid.New(),
		Email: email,
	})
	if err != nil {
		return domain.User{}, fmt.Errorf("insert user: %w", err)
	}
	return domain.User{
		ID:        row.ID,
		Email:     row.Email,
		CreatedAt: row.CreatedAt,
	}, nil
}

func (r *Repository) CreateSession(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) (domain.Session, error) {
	row, err := r.q.CreateSession(ctx, db.CreateSessionParams{
		ID:        uuid.New(),
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
	})
	if err != nil {
		return domain.Session{}, fmt.Errorf("insert session: %w", err)
	}
	return domain.Session{
		ID:        row.ID,
		UserID:    row.UserID,
		TokenHash: row.TokenHash,
		ExpiresAt: row.ExpiresAt,
		CreatedAt: row.CreatedAt,
	}, nil
}

func (r *Repository) GetByTokenHash(ctx context.Context, tokenHash string) (domain.Session, error) {
	row, err := r.q.GetSessionByTokenHash(ctx, tokenHash)
	if err != nil {
		return domain.Session{}, fmt.Errorf("query session by token hash: %w", err)
	}
	return domain.Session{
		ID:        row.ID,
		UserID:    row.UserID,
		TokenHash: row.TokenHash,
		ExpiresAt: row.ExpiresAt,
		CreatedAt: row.CreatedAt,
	}, nil
}
