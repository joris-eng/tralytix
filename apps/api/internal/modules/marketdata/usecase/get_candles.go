package usecase

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"
	"github.com/yourname/trading-saas/apps/api/internal/modules/marketdata/domain"
)

var (
	ErrInvalidSymbol    = errors.New("invalid symbol")
	ErrInvalidAsset     = errors.New("invalid asset")
	ErrInvalidTimeframe = errors.New("invalid timeframe")
	ErrInvalidRange     = errors.New("invalid time range")
)

type InstrumentRepository interface {
	Upsert(ctx context.Context, symbol, assetClass string, exchange *string, currency string) (domain.Instrument, error)
}

type CandleRepository interface {
	GetCandles(ctx context.Context, instrumentID string, timeframe string, from, to time.Time, limit int32) ([]domain.Candle, error)
	InsertCandle(ctx context.Context, candle domain.Candle) (domain.Candle, error)
}

type GetCandlesInput struct {
	Symbol    string
	Asset     string
	Timeframe string
	From      time.Time
	To        time.Time
}

type GetCandlesUseCase struct {
	instruments InstrumentRepository
	candles     CandleRepository
}

func NewGetCandlesUseCase(instruments InstrumentRepository, candles CandleRepository) *GetCandlesUseCase {
	return &GetCandlesUseCase{
		instruments: instruments,
		candles:     candles,
	}
}

func (uc *GetCandlesUseCase) Execute(ctx context.Context, input GetCandlesInput) ([]domain.Candle, error) {
	symbol := strings.ToUpper(strings.TrimSpace(input.Symbol))
	if symbol == "" {
		return nil, ErrInvalidSymbol
	}
	asset := strings.ToUpper(strings.TrimSpace(input.Asset))
	if asset != "FX" && asset != "STOCK" {
		return nil, ErrInvalidAsset
	}

	timeframe := strings.ToLower(strings.TrimSpace(input.Timeframe))
	step, err := parseTimeframe(timeframe)
	if err != nil {
		return nil, err
	}

	if input.From.IsZero() || input.To.IsZero() || !input.From.Before(input.To) {
		return nil, ErrInvalidRange
	}

	instrument, err := uc.instruments.Upsert(ctx, symbol, asset, nil, inferCurrency(symbol, asset))
	if err != nil {
		return nil, fmt.Errorf("upsert instrument: %w", err)
	}

	candles, err := uc.candles.GetCandles(ctx, instrument.ID, timeframe, input.From, input.To, 1000)
	if err != nil {
		return nil, fmt.Errorf("get candles: %w", err)
	}

	if len(candles) > 0 {
		return candles, nil
	}

	generated := generateDeterministicCandles(instrument.ID, timeframe, input.From, input.To, step)
	for i := range generated {
		inserted, err := uc.candles.InsertCandle(ctx, generated[i])
		if err != nil {
			return nil, fmt.Errorf("insert generated candle: %w", err)
		}
		generated[i] = inserted
	}

	return generated, nil
}

func parseTimeframe(tf string) (time.Duration, error) {
	switch strings.TrimSpace(strings.ToLower(tf)) {
	case "1m":
		return time.Minute, nil
	case "5m":
		return 5 * time.Minute, nil
	case "15m":
		return 15 * time.Minute, nil
	case "1h":
		return time.Hour, nil
	case "4h":
		return 4 * time.Hour, nil
	case "1d":
		return 24 * time.Hour, nil
	default:
		return 0, ErrInvalidTimeframe
	}
}

func inferCurrency(symbol string, asset string) string {
	if asset == "FX" && len(symbol) == 6 {
		return symbol[3:]
	}
	return "USD"
}

func generateDeterministicCandles(instrumentID string, timeframe string, from, to time.Time, step time.Duration) []domain.Candle {
	items := make([]domain.Candle, 0)
	base := 100.0 + float64(len(instrumentID)%7)
	i := 0
	for ts := from.UTC(); !ts.After(to.UTC()); ts = ts.Add(step) {
		phase := float64(i) / 8.0
		mid := base + 2.0*math.Sin(phase)
		open := mid + 0.2*math.Sin(phase/2.0)
		close := mid + 0.2*math.Cos(phase/2.0)
		high := math.Max(open, close) + 0.3
		low := math.Min(open, close) - 0.3
		vol := 1000.0 + 50.0*math.Sin(phase)

		items = append(items, domain.Candle{
			InstrumentID: instrumentID,
			Timeframe:    timeframe,
			TS:           ts,
			Open:         round4(open),
			High:         round4(high),
			Low:          round4(low),
			Close:        round4(close),
			Volume:       &vol,
			Provider:     "fake-deterministic",
		})
		i++
	}
	return items
}

func round4(v float64) float64 {
	return math.Round(v*10000) / 10000
}
