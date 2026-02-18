package domain

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrInvalidAccountID = errors.New("invalid account_id")
	ErrInvalidTicket    = errors.New("invalid ticket")
	ErrInvalidSymbol    = errors.New("invalid symbol")
	ErrInvalidSide      = errors.New("invalid side")
	ErrInvalidVolume    = errors.New("invalid volume")
	ErrInvalidOpenPrice = errors.New("invalid open_price")
	ErrInvalidOpenedAt  = errors.New("invalid opened_at")
	ErrInvalidSource    = errors.New("invalid source_hash")
)

type Trade struct {
	ID           string
	AccountID    string
	Ticket       string
	Symbol       string
	Side         string
	Volume       float64
	OpenPrice    float64
	ClosePrice   *float64
	OpenedAt     time.Time
	ClosedAt     *time.Time
	Commission   float64
	Swap         float64
	Profit       float64
	Comment      *string
	SourceHash   string
	ImportedAt   time.Time
}

type Position struct {
	AccountID string
	Symbol    string
	Side      string
	Volume    float64
	OpenedAt  time.Time
}

type AccountSnapshot struct {
	AccountID        string     `json:"account_id"`
	TotalTrades      int64      `json:"total_trades"`
	LastImportedAt   *time.Time `json:"last_imported_at,omitempty"`
	LastImportStatus string     `json:"last_import_status"`
}

func (t Trade) Validate() error {
	if strings.TrimSpace(t.AccountID) == "" {
		return ErrInvalidAccountID
	}
	if strings.TrimSpace(t.Ticket) == "" {
		return ErrInvalidTicket
	}
	if strings.TrimSpace(t.Symbol) == "" {
		return ErrInvalidSymbol
	}
	if t.Side != "LONG" && t.Side != "SHORT" {
		return ErrInvalidSide
	}
	if t.Volume <= 0 {
		return ErrInvalidVolume
	}
	if t.OpenPrice <= 0 {
		return ErrInvalidOpenPrice
	}
	if t.OpenedAt.IsZero() {
		return ErrInvalidOpenedAt
	}
	if t.ClosePrice != nil && *t.ClosePrice <= 0 {
		return fmt.Errorf("invalid close_price")
	}
	if t.ClosedAt != nil && t.ClosedAt.Before(t.OpenedAt) {
		return fmt.Errorf("closed_at is before opened_at")
	}
	if strings.TrimSpace(t.SourceHash) == "" {
		return ErrInvalidSource
	}
	return nil
}
