package domain

import "time"

type Trade struct {
	ID           string     `json:"id"`
	UserID       string     `json:"user_id"`
	InstrumentID string     `json:"instrument_id"`
	Side         string     `json:"side"`
	Qty          float64    `json:"qty"`
	EntryPrice   float64    `json:"entry_price"`
	ExitPrice    *float64   `json:"exit_price,omitempty"`
	OpenedAt     time.Time  `json:"opened_at"`
	ClosedAt     *time.Time `json:"closed_at,omitempty"`
	Fees         float64    `json:"fees"`
	Notes        *string    `json:"notes,omitempty"`
}
