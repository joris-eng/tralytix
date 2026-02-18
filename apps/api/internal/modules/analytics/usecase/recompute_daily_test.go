package usecase

import (
	"context"
	"testing"

	"github.com/yourname/trading-saas/apps/api/internal/modules/analytics/domain"
)

type fakeSummaryRepo struct {
	summary domain.MT5Summary
}

func (f fakeSummaryRepo) MT5SummaryByAccount(_ context.Context, _ string) (domain.MT5Summary, error) {
	return f.summary, nil
}

func (f fakeSummaryRepo) MT5EquityByAccount(_ context.Context, _ string) (domain.EquityResponse, error) {
	return domain.EquityResponse{}, nil
}

func TestApplySummaryRules(t *testing.T) {
	uc := NewGetMT5SummaryUseCase(fakeSummaryRepo{
		summary: domain.MT5Summary{
			AccountID:    "acc",
			TotalTrades:  0,
			Winners:      0,
			Losers:       0,
			WinRate:      "0.2",
			ProfitFactor: ptr("12.3"),
		},
	})

	got, err := uc.Execute(context.Background(), "acc")
	if err != nil {
		t.Fatalf("Execute() unexpected error: %v", err)
	}
	if got.WinRate != "0" {
		t.Fatalf("WinRate = %q, want 0", got.WinRate)
	}
	if got.ProfitFactor != nil {
		t.Fatalf("ProfitFactor = %v, want nil", *got.ProfitFactor)
	}
}

func ptr(v string) *string { return &v }
