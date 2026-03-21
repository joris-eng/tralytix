package application

import (
	"context"
	"strings"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/review/domain"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/review/ports"
)

type Service struct {
	repo ports.Repository
}

func NewService(repo ports.Repository) *Service {
	return &Service{repo: repo}
}

type UpsertInput struct {
	TradeID      int64
	Rating       int
	SetupTag     string
	Notes        string
	KeyLearnings []string
}

type ListResult struct {
	Trades []domain.TradeWithReview
	Stats  domain.Stats
}

func (s *Service) List(ctx context.Context, userID string) (ListResult, error) {
	trades, err := s.repo.ListTrades(ctx, userID)
	if err != nil {
		return ListResult{}, err
	}

	stats := computeStats(trades)
	return ListResult{Trades: trades, Stats: stats}, nil
}

func (s *Service) Upsert(ctx context.Context, userID string, in UpsertInput) (domain.Review, error) {
	if in.Rating < 0 || in.Rating > 5 {
		return domain.Review{}, domain.ErrInvalidInput
	}

	learnings := make([]string, 0, len(in.KeyLearnings))
	for _, l := range in.KeyLearnings {
		if trimmed := strings.TrimSpace(l); trimmed != "" {
			learnings = append(learnings, trimmed)
		}
	}

	return s.repo.Upsert(ctx, domain.Review{
		UserID:       userID,
		TradeID:      in.TradeID,
		Rating:       in.Rating,
		SetupTag:     strings.TrimSpace(in.SetupTag),
		Notes:        strings.TrimSpace(in.Notes),
		KeyLearnings: learnings,
	})
}

func (s *Service) Delete(ctx context.Context, userID string, tradeID int64) error {
	return s.repo.Delete(ctx, userID, tradeID)
}

func computeStats(trades []domain.TradeWithReview) domain.Stats {
	reviewed := 0
	totalRating := 0
	totalInsights := 0

	for _, t := range trades {
		if t.Review != nil && t.Review.Rating > 0 {
			reviewed++
			totalRating += t.Review.Rating
			totalInsights += len(t.Review.KeyLearnings)
		}
	}

	pending := len(trades) - reviewed
	avgRating := 0.0
	if reviewed > 0 {
		avgRating = float64(totalRating) / float64(reviewed)
	}

	return domain.Stats{
		Reviewed:      reviewed,
		Pending:       pending,
		AvgRating:     avgRating,
		TotalInsights: totalInsights,
	}
}
