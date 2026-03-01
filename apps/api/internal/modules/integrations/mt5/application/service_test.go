package application

import (
	"context"
	"testing"
	"time"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/domain"
)

type fakeRepo struct {
	inserted int
	trades   []domain.Trade
}

func (f *fakeRepo) SaveImportedTrades(_ context.Context, trades []domain.Trade) (int, error) {
	f.trades = append(f.trades, trades...)
	return f.inserted, nil
}

func (f *fakeRepo) GetAccountSnapshot(_ context.Context, accountID string) (domain.AccountSnapshot, error) {
	return domain.AccountSnapshot{AccountID: accountID, TotalTrades: int64(f.inserted)}, nil
}

func (f *fakeRepo) ListTrades(_ context.Context, _ string, _, _ int) ([]domain.Trade, error) {
	return nil, nil
}

type fakeImporter struct {
	trades []domain.Trade
}

func (f *fakeImporter) ImportCSV(_ context.Context, _ []byte) ([]domain.Trade, error) {
	return f.trades, nil
}

type fakeClock struct {
	now time.Time
}

func (f fakeClock) Now() time.Time { return f.now }

func TestImportCSV_DeduplicatesAndValidates(t *testing.T) {
	openedAt := time.Date(2026, 2, 16, 10, 0, 0, 0, time.UTC)
	repo := &fakeRepo{inserted: 1}
	importer := &fakeImporter{
		trades: []domain.Trade{
			{Ticket: "1", Symbol: "eurusd", Side: "buy", Volume: 1, OpenPrice: 1.1, OpenedAt: openedAt},
			{Ticket: "1", Symbol: "EURUSD", Side: "LONG", Volume: 1, OpenPrice: 1.1, OpenedAt: openedAt},
			{Ticket: "", Symbol: "EURUSD", Side: "LONG", Volume: 1, OpenPrice: 1.1, OpenedAt: openedAt},
		},
	}
	svc := NewService(repo, importer, fakeClock{now: openedAt.Add(time.Hour)}, 100)

	got, err := svc.ImportCSV(context.Background(), "acc-1", []byte("csv"))
	if err != nil {
		t.Fatalf("ImportCSV() unexpected error: %v", err)
	}

	if got.TotalRows != 3 {
		t.Fatalf("TotalRows = %d, want 3", got.TotalRows)
	}
	if got.ValidRows != 1 {
		t.Fatalf("ValidRows = %d, want 1", got.ValidRows)
	}
	if got.InsertedRows != 1 {
		t.Fatalf("InsertedRows = %d, want 1", got.InsertedRows)
	}
	if got.SkippedInvalidRows != 1 {
		t.Fatalf("SkippedInvalidRows = %d, want 1", got.SkippedInvalidRows)
	}
	if got.SkippedDuplicateRows != 1 {
		t.Fatalf("SkippedDuplicateRows = %d, want 1", got.SkippedDuplicateRows)
	}
}
