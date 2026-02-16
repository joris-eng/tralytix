package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourname/trading-saas/apps/api/internal/modules/marketdata/domain"
	"github.com/yourname/trading-saas/apps/api/internal/platform/db"
)

type Repository struct {
	q *db.Queries
}

func NewRepository(q *db.Queries) *Repository {
	return &Repository{q: q}
}

func (r *Repository) Upsert(ctx context.Context, symbol, assetClass string, exchange *string, currency string) (domain.Instrument, error) {
	row, err := r.q.UpsertInstrument(ctx, db.UpsertInstrumentParams{
		ID:         uuid.NewString(),
		Symbol:     symbol,
		AssetClass: assetClass,
		Exchange:   exchange,
		Currency:   currency,
	})
	if err != nil {
		return domain.Instrument{}, fmt.Errorf("upsert instrument: %w", err)
	}

	return domain.Instrument{
		ID:         row.ID,
		Symbol:     row.Symbol,
		AssetClass: row.AssetClass,
		Exchange:   row.Exchange,
		Currency:   row.Currency,
		CreatedAt:  row.CreatedAt,
	}, nil
}

func (r *Repository) GetCandles(ctx context.Context, instrumentID string, timeframe string, from, to time.Time, limit int32) ([]domain.Candle, error) {
	rows, err := r.q.GetCandles(ctx, db.GetCandlesParams{
		InstrumentID: instrumentID,
		Timeframe:    timeframe,
		FromTS:       from,
		ToTS:         to,
		LimitRows:    limit,
	})
	if err != nil {
		return nil, fmt.Errorf("query candles: %w", err)
	}

	out := make([]domain.Candle, 0, len(rows))
	for _, c := range rows {
		out = append(out, domain.Candle{
			InstrumentID: c.InstrumentID,
			Timeframe:    c.Timeframe,
			TS:           c.TS,
			Open:         c.Open,
			High:         c.High,
			Low:          c.Low,
			Close:        c.Close,
			Volume:       c.Volume,
			Provider:     c.Provider,
		})
	}
	return out, nil
}

func (r *Repository) InsertCandle(ctx context.Context, candle domain.Candle) (domain.Candle, error) {
	row, err := r.q.InsertCandle(ctx, db.InsertCandleParams{
		InstrumentID: candle.InstrumentID,
		Timeframe:    candle.Timeframe,
		TS:           candle.TS,
		Open:         candle.Open,
		High:         candle.High,
		Low:          candle.Low,
		Close:        candle.Close,
		Volume:       candle.Volume,
		Provider:     candle.Provider,
	})
	if err != nil {
		return domain.Candle{}, fmt.Errorf("insert candle: %w", err)
	}

	return domain.Candle{
		InstrumentID: row.InstrumentID,
		Timeframe:    row.Timeframe,
		TS:           row.TS,
		Open:         row.Open,
		High:         row.High,
		Low:          row.Low,
		Close:        row.Close,
		Volume:       row.Volume,
		Provider:     row.Provider,
	}, nil
}
