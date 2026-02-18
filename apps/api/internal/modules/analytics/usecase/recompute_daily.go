package usecase

import (
	"context"
	"fmt"
	"strings"
)

type RecomputeDailyRepository interface {
	RecomputeDaily(ctx context.Context, accountID string) (int, error)
}

type RecomputeDailyUseCase struct {
	repo RecomputeDailyRepository
}

type RecomputeDailyOutput struct {
	Status      string `json:"status"`
	DaysWritten int    `json:"days_written"`
}

func NewRecomputeDailyUseCase(repo RecomputeDailyRepository) *RecomputeDailyUseCase {
	return &RecomputeDailyUseCase{repo: repo}
}

func (uc *RecomputeDailyUseCase) Execute(ctx context.Context, accountID string) (RecomputeDailyOutput, error) {
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return RecomputeDailyOutput{}, fmt.Errorf("account id is required")
	}
	n, err := uc.repo.RecomputeDaily(ctx, accountID)
	if err != nil {
		return RecomputeDailyOutput{}, fmt.Errorf("recompute daily analytics: %w", err)
	}
	return RecomputeDailyOutput{
		Status:      "ok",
		DaysWritten: n,
	}, nil
}
