package ports

import (
	"context"
	"time"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/domain"
)

type TradeRepository interface {
	SaveImportedTrades(ctx context.Context, trades []domain.Trade) (int, error)
	GetAccountSnapshot(ctx context.Context, accountID string) (domain.AccountSnapshot, error)
	ListTrades(ctx context.Context, accountID string, limit, offset int) ([]domain.Trade, error)
	// EA live sync
	GetOrCreateEAToken(ctx context.Context, userID string) (string, error)
	GetUserByEAToken(ctx context.Context, token string) (string, error)
}

type Importer interface {
	ImportCSV(ctx context.Context, data []byte) ([]domain.Trade, error)
}

type Clock interface {
	Now() time.Time
}
