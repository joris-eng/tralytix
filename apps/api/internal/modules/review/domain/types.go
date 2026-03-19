package domain

import (
	"errors"
	"time"
)

var (
	ErrNotFound     = errors.New("review not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrInvalidInput = errors.New("invalid input")
)

// Review is the user's annotation on an MT5 trade.
type Review struct {
	ID           string
	UserID       string
	TradeID      int64
	Rating       int // 0-5
	SetupTag     string
	Notes        string
	KeyLearnings []string
	ReviewedAt   time.Time
	UpdatedAt    time.Time
}

// TradeWithReview combines an MT5 trade row with its optional review.
type TradeWithReview struct {
	TradeID    int64
	Symbol     string
	Side       string // BUY / SELL
	Profit     float64
	EntryPrice float64
	ClosePrice float64
	OpenedAt   time.Time
	ClosedAt   time.Time
	Review     *Review // nil = not yet reviewed
}

// Stats aggregated for the revision page.
type Stats struct {
	Reviewed     int     `json:"reviewed"`
	Pending      int     `json:"pending"`
	AvgRating    float64 `json:"avg_rating"`
	TotalInsights int    `json:"total_insights"`
}
