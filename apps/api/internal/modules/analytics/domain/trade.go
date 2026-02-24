package domain

import "time"

type Trade struct {
	Side       string
	Qty        float64
	EntryPrice float64
	ExitPrice  *float64
	ClosedAt   *time.Time
	Fees       float64
}
