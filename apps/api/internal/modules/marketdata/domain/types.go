package domain

import "time"

type Instrument struct {
	ID         string
	Symbol     string
	AssetClass string
	Exchange   *string
	Currency   string
	CreatedAt  time.Time
}

type Candle struct {
	InstrumentID string    `json:"instrument_id"`
	Timeframe    string    `json:"timeframe"`
	TS           time.Time `json:"ts"`
	Open         float64   `json:"open"`
	High         float64   `json:"high"`
	Low          float64   `json:"low"`
	Close        float64   `json:"close"`
	Volume       *float64  `json:"volume,omitempty"`
	Provider     string    `json:"provider"`
}
