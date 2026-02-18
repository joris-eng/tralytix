package postgres

import (
	"context"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
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
	exchangeText := pgtype.Text{}
	if exchange != nil {
		exchangeText = pgtype.Text{String: *exchange, Valid: true}
	}

	row, err := r.q.UpsertInstrument(ctx, db.UpsertInstrumentParams{
		ID:         uuid.New(),
		Symbol:     symbol,
		AssetClass: assetClass,
		Exchange:   exchangeText,
		Currency:   currency,
	})
	if err != nil {
		return domain.Instrument{}, fmt.Errorf("upsert instrument: %w", err)
	}

	return domain.Instrument{
		ID:         row.ID.String(),
		Symbol:     row.Symbol,
		AssetClass: row.AssetClass,
		Exchange:   textToStringPtr(row.Exchange),
		Currency:   row.Currency,
		CreatedAt:  row.CreatedAt,
	}, nil
}

func (r *Repository) GetCandles(
	ctx context.Context,
	instrumentID string,
	timeframe string,
	from, to time.Time,
	limit int32,
) ([]domain.Candle, error) {

	id, err := uuid.Parse(instrumentID)
	if err != nil {
		return nil, fmt.Errorf("invalid instrumentID: %w", err)
	}

	rows, err := r.q.GetCandles(ctx, db.GetCandlesParams{
		InstrumentID: id,
		Timeframe:    timeframe,
		Ts:           from,
		Ts_2:         to,
		Limit:        limit,
	})
	if err != nil {
		return nil, fmt.Errorf("query candles: %w", err)
	}

	out := make([]domain.Candle, 0, len(rows))
	for _, c := range rows {
		out = append(out, domain.Candle{
			InstrumentID: c.InstrumentID.String(),
			Timeframe:    c.Timeframe,
			TS:           c.Ts,
			Open:         numericToFloat64(c.Open),
			High:         numericToFloat64(c.High),
			Low:          numericToFloat64(c.Low),
			Close:        numericToFloat64(c.Close),
			Volume:       numericPtrToFloat64(c.Volume),
			Provider:     c.Provider,
		})
	}

	return out, nil
}

func (r *Repository) InsertCandle(ctx context.Context, candle domain.Candle) (domain.Candle, error) {
	instrumentID, err := uuid.Parse(candle.InstrumentID)
	if err != nil {
		return domain.Candle{}, fmt.Errorf("parse instrumentID: %w", err)
	}

	volume := pgtype.Numeric{}
	if candle.Volume != nil {
		volume = float64ToNumeric(*candle.Volume)
	}

	row, err := r.q.InsertCandle(ctx, db.InsertCandleParams{
		InstrumentID: instrumentID,
		Timeframe:    candle.Timeframe,
		Ts:           candle.TS,
		Open:         float64ToNumeric(candle.Open),
		High:         float64ToNumeric(candle.High),
		Low:          float64ToNumeric(candle.Low),
		Close:        float64ToNumeric(candle.Close),
		Volume:       volume,
		Provider:     candle.Provider,
	})
	if err != nil {
		return domain.Candle{}, fmt.Errorf("insert candle: %w", err)
	}

	return domain.Candle{
		InstrumentID: row.InstrumentID.String(),
		Timeframe:    row.Timeframe,
		TS:           row.Ts,
		Open:         numericToFloat64(row.Open),
		High:         numericToFloat64(row.High),
		Low:          numericToFloat64(row.Low),
		Close:        numericToFloat64(row.Close),
		Volume:       numericPtrToFloat64(row.Volume),
		Provider:     row.Provider,
	}, nil
}

func float64ToNumeric(v float64) pgtype.Numeric {
	return pgtype.Numeric{Int: big.NewInt(int64(v * 1000000)), Exp: -6, Valid: true}
}

func numericToFloat64(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return 0
	}
	return f.Float64
}

func numericPtrToFloat64(n pgtype.Numeric) *float64 {
	if !n.Valid {
		return nil
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return nil
	}
	out := f.Float64
	return &out
}

func textToStringPtr(v pgtype.Text) *string {
	if !v.Valid {
		return nil
	}
	out := v.String
	return &out
}
