package ports

import (
	"context"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/journal/domain"
)

type Repository interface {
	Create(ctx context.Context, entry domain.Entry) (domain.Entry, error)
	List(ctx context.Context, userID string) ([]domain.Entry, error)
	Get(ctx context.Context, id, userID string) (domain.Entry, error)
	Update(ctx context.Context, entry domain.Entry) (domain.Entry, error)
	Delete(ctx context.Context, id, userID string) error
}
