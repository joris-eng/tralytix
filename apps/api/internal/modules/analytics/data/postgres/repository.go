package postgres

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	analyticsdomain "github.com/joris-eng/tralytix/apps/api/internal/modules/analytics/domain"
	tradingdomain "github.com/joris-eng/tralytix/apps/api/internal/modules/trading/domain"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/db"
)

type Repository struct {
	q *db.Queries
}

func NewRepository(q *db.Queries) *Repository {
	return &Repository{q: q}
}

func (r *Repository) ListByUser(ctx context.Context, userID string, limit, offset int32) ([]tradingdomain.Trade, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("parse user id: %w", err)
	}

	rows, err := r.q.ListTradesByUser(ctx, db.ListTradesByUserParams{
		UserID: uid,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("query trades by user: %w", err)
	}
	out := make([]tradingdomain.Trade, 0, len(rows))
	for _, t := range rows {
		out = append(out, mapTrade(t))
	}
	return out, nil
}

func mapTrade(t db.Trade) tradingdomain.Trade {
	return tradingdomain.Trade{
		ID:           t.ID.String(),
		UserID:       t.UserID.String(),
		InstrumentID: t.InstrumentID.String(),
		Side:         t.Side,
		Qty:          numericToFloat64(t.Qty),
		EntryPrice:   numericToFloat64(t.EntryPrice),
		ExitPrice:    numericToFloat64Ptr(t.ExitPrice),
		OpenedAt:     t.OpenedAt,
		ClosedAt:     timestamptzToTimePtr(t.ClosedAt),
		Fees:         numericToFloat64(t.Fees),
		Notes:        textToStringPtr(t.Notes),
	}
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

func numericToFloat64Ptr(n pgtype.Numeric) *float64 {
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

func timestamptzToTimePtr(ts pgtype.Timestamptz) *time.Time {
	if !ts.Valid {
		return nil
	}
	tt := ts.Time
	return &tt
}

func textToStringPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	s := t.String
	return &s
}

func (r *Repository) MT5SummaryByAccount(ctx context.Context, accountID string) (analyticsdomain.MT5Summary, error) {
	uid, err := uuid.Parse(accountID)
	if err != nil {
		return analyticsdomain.MT5Summary{}, fmt.Errorf("parse account id: %w", err)
	}

	row, err := r.q.GetMT5Summary(ctx, uid)
	if err != nil {
		return analyticsdomain.MT5Summary{}, fmt.Errorf("query mt5 summary: %w", err)
	}

	snapshot, err := r.q.GetMT5AccountSnapshot(ctx, uid)
	if err != nil {
		return analyticsdomain.MT5Summary{}, fmt.Errorf("query mt5 snapshot: %w", err)
	}

	out := analyticsdomain.MT5Summary{
		AccountID:    accountID,
		TotalTrades:  row.TotalTrades,
		TotalProfit:  numericToString(row.TotalProfit),
		AvgProfit:    numericToString(row.AvgProfit),
		Winners:      row.Winners,
		Losers:       row.Losers,
		WinRate:      numericToString(row.WinRate),
		ProfitFactor: numericToStringPtr(row.ProfitFactor),
		MaxProfit:    numericToString(row.MaxProfit),
		MinProfit:    numericToString(row.MinProfit),
	}
	out.LastImportedAt = toRFC3339StringPtr(snapshot.LastImportedAt)
	return out, nil
}

func numericToString(n pgtype.Numeric) string {
	if !n.Valid {
		return "0"
	}
	b, err := n.MarshalJSON()
	if err != nil {
		return "0"
	}
	s := strings.TrimSpace(string(b))
	if s == "" || s == "null" {
		return "0"
	}
	return s
}

func numericToStringPtr(n pgtype.Numeric) *string {
	if !n.Valid {
		return nil
	}
	b, err := n.MarshalJSON()
	if err != nil {
		return nil
	}
	s := strings.TrimSpace(string(b))
	if s == "" || s == "null" {
		return nil
	}
	return &s
}

func toRFC3339StringPtr(v interface{}) *string {
	if v == nil {
		return nil
	}
	tm, ok := v.(time.Time)
	if !ok {
		return nil
	}
	s := tm.Format(time.RFC3339)
	return &s
}

func (r *Repository) MT5EquityByAccount(ctx context.Context, accountID string) (analyticsdomain.EquityResponse, error) {
	uid, err := uuid.Parse(accountID)
	if err != nil {
		return analyticsdomain.EquityResponse{}, fmt.Errorf("parse account id: %w", err)
	}

	dailyRows, err := r.q.GetMT5EquityFromDaily(ctx, uid)
	if err != nil {
		return analyticsdomain.EquityResponse{}, fmt.Errorf("query equity from daily: %w", err)
	}
	points := make([]analyticsdomain.EquityPoint, 0, len(dailyRows))
	for _, row := range dailyRows {
		points = append(points, analyticsdomain.EquityPoint{
			Day:    dateToYYYYMMDD(row.Day),
			Equity: numericToString(row.Equity),
		})
	}
	if len(points) > 0 {
		return analyticsdomain.EquityResponse{Points: points}, nil
	}

	fallbackRows, err := r.q.GetMT5EquityFallback(ctx, uid)
	if err != nil {
		return analyticsdomain.EquityResponse{}, fmt.Errorf("query equity fallback: %w", err)
	}
	points = make([]analyticsdomain.EquityPoint, 0, len(fallbackRows))
	for _, row := range fallbackRows {
		points = append(points, analyticsdomain.EquityPoint{
			Day:    dateToYYYYMMDD(row.Day),
			Equity: numericToString(row.Equity),
		})
	}
	return analyticsdomain.EquityResponse{Points: points}, nil
}

func (r *Repository) RecomputeDaily(ctx context.Context, accountID string) (int, error) {
	uid, err := uuid.Parse(accountID)
	if err != nil {
		return 0, fmt.Errorf("parse account id: %w", err)
	}
	rowsAffected, err := r.q.RecomputeMT5AnalyticsDaily(ctx, uid)
	if err != nil {
		return 0, fmt.Errorf("recompute daily analytics: %w", err)
	}
	return int(rowsAffected), nil
}

func dateToYYYYMMDD(d pgtype.Date) string {
	if !d.Valid {
		return ""
	}
	return d.Time.Format("2006-01-02")
}
