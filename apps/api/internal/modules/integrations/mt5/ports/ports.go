package ports

import (
	"context"
	"time"

	"github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/domain"
)

type TradeRepository interface {
	SaveImportedTrades(ctx context.Context, trades []domain.Trade) (int, error)
	GetAccountSnapshot(ctx context.Context, accountID string) (domain.AccountSnapshot, error)
}

type Importer interface {
	ImportCSV(ctx context.Context, data []byte) ([]domain.Trade, error)
}

type Clock interface {
	Now() time.Time
}
