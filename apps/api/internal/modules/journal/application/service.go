package application

import (
	"context"
	"strings"
	"time"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/journal/domain"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/journal/ports"
)

type Service struct {
	repo ports.Repository
}

func NewService(repo ports.Repository) *Service {
	return &Service{repo: repo}
}

type CreateInput struct {
	Symbol     string
	Side       string
	Timeframe  string
	EntryPrice float64
	ClosePrice float64
	Profit     float64
	OpenedAt   string // "YYYY-MM-DD"
	Setup      string
	Emotions   []string
	Notes      string
	Lessons    string
}

type Stats struct {
	TotalEntries       int     `json:"total_entries"`
	DocumentedSetups   int     `json:"documented_setups"`
	LessonsLearned     int     `json:"lessons_learned"`
	DocumentationRate  float64 `json:"documentation_rate"`
}

func (s *Service) Create(ctx context.Context, userID string, in CreateInput) (domain.Entry, error) {
	openedAt, err := time.Parse("2006-01-02", strings.TrimSpace(in.OpenedAt))
	if err != nil {
		openedAt = time.Now().UTC()
	}

	side := strings.ToUpper(strings.TrimSpace(in.Side))
	if side != "LONG" && side != "SHORT" {
		return domain.Entry{}, domain.ErrInvalidEntry
	}

	entry := domain.Entry{
		UserID:     userID,
		Symbol:     strings.ToUpper(strings.TrimSpace(in.Symbol)),
		Side:       side,
		Timeframe:  strings.TrimSpace(in.Timeframe),
		EntryPrice: in.EntryPrice,
		ClosePrice: in.ClosePrice,
		Profit:     in.Profit,
		OpenedAt:   openedAt,
		Setup:      strings.TrimSpace(in.Setup),
		Emotions:   in.Emotions,
		Notes:      strings.TrimSpace(in.Notes),
		Lessons:    strings.TrimSpace(in.Lessons),
	}
	if entry.Emotions == nil {
		entry.Emotions = []string{}
	}

	if err := entry.Validate(); err != nil {
		return domain.Entry{}, err
	}
	return s.repo.Create(ctx, entry)
}

func (s *Service) List(ctx context.Context, userID string) ([]domain.Entry, Stats, error) {
	entries, err := s.repo.List(ctx, userID)
	if err != nil {
		return nil, Stats{}, err
	}
	return entries, computeStats(entries), nil
}

func (s *Service) Get(ctx context.Context, id, userID string) (domain.Entry, error) {
	return s.repo.Get(ctx, id, userID)
}

func (s *Service) Update(ctx context.Context, id, userID string, in CreateInput) (domain.Entry, error) {
	existing, err := s.repo.Get(ctx, id, userID)
	if err != nil {
		return domain.Entry{}, err
	}

	openedAt, err := time.Parse("2006-01-02", strings.TrimSpace(in.OpenedAt))
	if err != nil {
		openedAt = existing.OpenedAt
	}

	existing.Symbol = strings.ToUpper(strings.TrimSpace(in.Symbol))
	existing.Side = strings.ToUpper(strings.TrimSpace(in.Side))
	existing.Timeframe = strings.TrimSpace(in.Timeframe)
	existing.EntryPrice = in.EntryPrice
	existing.ClosePrice = in.ClosePrice
	existing.Profit = in.Profit
	existing.OpenedAt = openedAt
	existing.Setup = strings.TrimSpace(in.Setup)
	existing.Emotions = in.Emotions
	if existing.Emotions == nil {
		existing.Emotions = []string{}
	}
	existing.Notes = strings.TrimSpace(in.Notes)
	existing.Lessons = strings.TrimSpace(in.Lessons)

	return s.repo.Update(ctx, existing)
}

func (s *Service) Delete(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}

func computeStats(entries []domain.Entry) Stats {
	total := len(entries)
	setups := 0
	lessons := 0
	documented := 0
	for _, e := range entries {
		if e.Setup != "" {
			setups++
		}
		if e.Lessons != "" {
			lessons++
		}
		if e.Setup != "" && e.Notes != "" {
			documented++
		}
	}
	rate := 0.0
	if total > 0 {
		rate = float64(documented) / float64(total) * 100
	}
	return Stats{
		TotalEntries:      total,
		DocumentedSetups:  setups,
		LessonsLearned:    lessons,
		DocumentationRate: rate,
	}
}
