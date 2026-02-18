package usecase

import (
	"context"
	"fmt"
	"strings"

	"github.com/yourname/trading-saas/apps/api/internal/modules/analytics/domain"
)

type MT5SummaryRepository interface {
	MT5SummaryByAccount(ctx context.Context, accountID string) (domain.MT5Summary, error)
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
	return summary, nil
}
