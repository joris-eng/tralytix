package usecase

import (
	"context"
	"testing"

	"github.com/yourname/trading-saas/apps/api/internal/modules/analytics/domain"
)

type fakeSummaryUC struct {
	summary domain.MT5Summary
	err     error
}

func (f fakeSummaryUC) Execute(_ context.Context, _ string) (domain.MT5Summary, error) {
	return f.summary, f.err
}

func TestGetMT5Insights_NoData(t *testing.T) {
	uc := NewGetMT5InsightsUseCase(fakeSummaryUC{
		summary: domain.MT5Summary{
			AccountID:   "acc-1",
			TotalTrades: 0,
		},
	})

	out, err := uc.Execute(context.Background(), "acc-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if out.Score != 0 {
		t.Fatalf("expected score 0, got %d", out.Score)
	}
	if out.Label != "No data" {
		t.Fatalf("expected label No data, got %s", out.Label)
	}
	if len(out.TopInsights) < 1 {
		t.Fatalf("expected at least one insight")
	}
}

func TestGetMT5Insights_RiskManagementPriority(t *testing.T) {
	pf := "0.8"
	uc := NewGetMT5InsightsUseCase(fakeSummaryUC{
		summary: domain.MT5Summary{
			AccountID:    "acc-1",
			TotalTrades:  120,
			TotalProfit:  "-150",
			AvgProfit:    "-1.25",
			Winners:      40,
			Losers:       80,
			WinRate:      "0.33",
			ProfitFactor: &pf,
			MaxProfit:    "20",
			MinProfit:    "-90",
		},
	})

	out, err := uc.Execute(context.Background(), "acc-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if out.Score >= 50 {
		t.Fatalf("expected score to decrease below base 50, got %d", out.Score)
	}
	if out.RecommendedAction.Title != "Priorité Risk Management" {
		t.Fatalf("expected risk management action, got %s", out.RecommendedAction.Title)
	}
}

func TestGetMT5Insights_HighWinRateInsight(t *testing.T) {
	pf := "1.1"
	uc := NewGetMT5InsightsUseCase(fakeSummaryUC{
		summary: domain.MT5Summary{
			AccountID:    "acc-1",
			TotalTrades:  80,
			TotalProfit:  "200",
			AvgProfit:    "2.5",
			Winners:      70,
			Losers:       10,
			WinRate:      "0.88",
			ProfitFactor: &pf,
			MaxProfit:    "15",
			MinProfit:    "-8",
		},
	})

	out, err := uc.Execute(context.Background(), "acc-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	found := false
	for _, item := range out.TopInsights {
		if item.Title == "Win rate très élevé" {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected dedicated high win rate insight")
	}
}
