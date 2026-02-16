package usecase

import (
	"context"
	"fmt"

	"github.com/yourname/trading-saas/apps/api/internal/modules/analytics/domain"
	tradingdomain "github.com/yourname/trading-saas/apps/api/internal/modules/trading/domain"
)

type TradeReader interface {
	ListByUser(ctx context.Context, userID string, limit, offset int32) ([]tradingdomain.Trade, error)
}

type UseCase struct {
	trades TradeReader
}

func NewUseCase(trades TradeReader) *UseCase {
	return &UseCase{trades: trades}
}

func (uc *UseCase) SummaryByUser(ctx context.Context, userID string) (domain.Summary, error) {
	trades, err := uc.trades.ListByUser(ctx, userID, 1000, 0)
	if err != nil {
		return domain.Summary{}, fmt.Errorf("list trades by user: %w", err)
	}

	var (
		closedCount  int64
		wins         int64
		sumPnL       float64
		grossProfit  float64
		grossLossAbs float64
	)

	for _, t := range trades {
		if t.ClosedAt == nil || t.ExitPrice == nil {
			continue
		}
		closedCount++
		pnl := computePnL(t)
		sumPnL += pnl
		if pnl > 0 {
			wins++
			grossProfit += pnl
		} else if pnl < 0 {
			grossLossAbs += -pnl
		}
	}

	var winrate float64
	var avgPnL float64
	var profitFactor float64
	if closedCount > 0 {
		winrate = float64(wins) / float64(closedCount)
		avgPnL = sumPnL / float64(closedCount)
	}
	if grossLossAbs > 0 {
		profitFactor = grossProfit / grossLossAbs
	}

	return domain.Summary{
		TradesCount:  int64(len(trades)),
		Winrate:      winrate,
		AvgPnL:       avgPnL,
		ProfitFactor: profitFactor,
	}, nil
}

func computePnL(t tradingdomain.Trade) float64 {
	if t.ExitPrice == nil {
		return 0
	}
	switch t.Side {
	case "LONG":
		return (t.Qty * (*t.ExitPrice - t.EntryPrice)) - t.Fees
	case "SHORT":
		return (t.Qty * (t.EntryPrice - *t.ExitPrice)) - t.Fees
	default:
		return 0
	}
}
