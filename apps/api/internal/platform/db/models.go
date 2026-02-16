package db

import "time"

type User struct {
	ID        string
	Email     string
	CreatedAt time.Time
}

type Session struct {
	ID        string
	UserID    string
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}

type Instrument struct {
	ID         string
	Symbol     string
	AssetClass string
	Exchange   *string
	Currency   string
	CreatedAt  time.Time
}

type Candle struct {
	InstrumentID string
	Timeframe    string
	TS           time.Time
	Open         float64
	High         float64
	Low          float64
	Close        float64
	Volume       *float64
	Provider     string
}

type Trade struct {
	ID           string
	UserID       string
	InstrumentID string
	Side         string
	Qty          float64
	EntryPrice   float64
	ExitPrice    *float64
	OpenedAt     time.Time
	ClosedAt     *time.Time
	Fees         float64
	Notes        *string
}
