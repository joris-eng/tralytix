package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/analytics/domain"
)

type MT5SummaryRepository interface {
	MT5SummaryByAccount(ctx context.Context, accountID string) (domain.MT5Summary, error)
	MT5EquityByAccount(ctx context.Context, accountID string) (domain.EquityResponse, error)
}

type GetMT5SummaryUseCase struct {
	repo MT5SummaryRepository
}

func NewGetMT5SummaryUseCase(repo MT5SummaryRepository) *GetMT5SummaryUseCase {
	return &GetMT5SummaryUseCase{repo: repo}
}

func (uc *GetMT5SummaryUseCase) Execute(ctx context.Context, accountID string) (domain.MT5Summary, error) {
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return domain.MT5Summary{}, fmt.Errorf("account id is required")
	}
	summary, err := uc.repo.MT5SummaryByAccount(ctx, accountID)
	if err != nil {
		return domain.MT5Summary{}, fmt.Errorf("get mt5 summary: %w", err)
	}
	return applySummaryRules(summary), nil
}

func (uc *GetMT5SummaryUseCase) Equity(ctx context.Context, accountID string) (domain.EquityResponse, error) {
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return domain.EquityResponse{}, fmt.Errorf("account id is required")
	}
	out, err := uc.repo.MT5EquityByAccount(ctx, accountID)
	if err != nil {
		return domain.EquityResponse{}, fmt.Errorf("get mt5 equity: %w", err)
	}
	return out, nil
}

func applySummaryRules(s domain.MT5Summary) domain.MT5Summary {
	if s.TotalTrades == 0 {
		s.WinRate = "0"
	}
	if s.Losers == 0 {
		s.ProfitFactor = nil
	}
	return s
}
