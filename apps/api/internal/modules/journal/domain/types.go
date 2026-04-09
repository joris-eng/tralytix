package domain

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrNotFound     = errors.New("journal entry not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrInvalidEntry = errors.New("invalid journal entry")
)

type Entry struct {
	ID         string
	UserID     string
	Symbol     string
	Side       string // "LONG" | "SHORT"
	Timeframe  string
	EntryPrice float64
	ClosePrice float64
	Profit     float64
	OpenedAt   time.Time
	Setup      string
	Emotions   []string
	Notes      string
	Lessons    string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (e Entry) Validate() error {
	if strings.TrimSpace(e.Symbol) == "" {
		return ErrInvalidEntry
	}
	if e.Side != "LONG" && e.Side != "SHORT" {
		return ErrInvalidEntry
	}
	return nil
}
