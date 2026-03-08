package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type symbolConfig struct {
	MinPrice float64
	MaxPrice float64
	PipValue float64
}

type tradeRow struct {
	AccountID  string
	Ticket     string
	Symbol     string
	Side       string
	Volume     float64
	OpenPrice  float64
	ClosePrice float64
	OpenedAt   time.Time
	ClosedAt   time.Time
	Commission float64
	Swap       float64
	Profit     float64
	Comment    string
	SourceHash string
	ImportedAt time.Time
}

func main() {
	dsn := ""
	if len(os.Args) > 1 {
		dsn = strings.TrimSpace(os.Args[1])
	}
	if dsn == "" {
		dsn = strings.TrimSpace(os.Getenv("DB_DSN"))
	}
	if dsn == "" {
		fmt.Println("missing DB DSN (arg[1] or DB_DSN env)")
		os.Exit(1)
	}

	defaultAccountID := uuid.NewSHA1(uuid.NameSpaceOID, []byte("seed-account-001")).String()
	accountID := defaultAccountID
	if len(os.Args) > 2 && strings.TrimSpace(os.Args[2]) != "" {
		accountID = strings.TrimSpace(os.Args[2])
	}
	if _, err := uuid.Parse(accountID); err != nil {
		fmt.Printf("invalid account id %q (must be UUID): %v\n", accountID, err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		fmt.Printf("connect db: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := ensureUser(ctx, pool, accountID); err != nil {
		fmt.Printf("ensure user: %v\n", err)
		os.Exit(1)
	}

	rng := rand.New(rand.NewSource(42))
	trades := generateTrades(rng, accountID, 150)
	inserted, stats, err := insertTrades(ctx, pool, trades)
	if err != nil {
		fmt.Printf("insert trades: %v\n", err)
		os.Exit(1)
	}

	winRate := 0.0
	if stats.Total > 0 {
		winRate = float64(stats.Winners) / float64(stats.Total) * 100
	}
	avgProfit := 0.0
	if stats.Total > 0 {
		avgProfit = stats.TotalProfit / float64(stats.Total)
	}

	fmt.Printf("Inserted %d/%d trades\n", inserted, len(trades))
	fmt.Printf("Summary => win rate: %.2f%%, total profit: %.2f, avg profit: %.2f\n", winRate, stats.TotalProfit, avgProfit)
}

func ensureUser(ctx context.Context, pool *pgxpool.Pool, accountID string) error {
	email := fmt.Sprintf("seed+%s@tralytix.local", strings.ReplaceAll(accountID, "-", ""))
	const q = `
INSERT INTO users (id, email)
VALUES ($1::uuid, $2)
ON CONFLICT (id) DO NOTHING`
	_, err := pool.Exec(ctx, q, accountID, email)
	return err
}

func generateTrades(rng *rand.Rand, accountID string, total int) []tradeRow {
	symbols := []string{"EURUSD", "GBPUSD", "XAUUSD", "USDJPY", "NASDAQ"}
	cfg := map[string]symbolConfig{
		"EURUSD": {MinPrice: 1.08, MaxPrice: 1.12, PipValue: 100000},
		"GBPUSD": {MinPrice: 1.25, MaxPrice: 1.30, PipValue: 100000},
		"XAUUSD": {MinPrice: 1900, MaxPrice: 2100, PipValue: 100},
		"USDJPY": {MinPrice: 145, MaxPrice: 152, PipValue: 1000},
		"NASDAQ": {MinPrice: 15000, MaxPrice: 18000, PipValue: 10},
	}
	comments := []string{
		"London breakout",
		"NY reversal",
		"Trend continuation",
		"Support bounce",
		"Risk-off move",
	}

	now := time.Now().UTC()
	out := make([]tradeRow, 0, total)

	lastSide := "LONG"
	for i := 0; i < total; i++ {
		symbol := symbols[rng.Intn(len(symbols))]
		symbolCfg := cfg[symbol]

		// Slightly alternating with randomness for more natural side distribution.
		if i%2 == 0 || rng.Float64() < 0.60 {
			if lastSide == "LONG" {
				lastSide = "SHORT"
			} else {
				lastSide = "LONG"
			}
		}
		side := lastSide

		volume := round(0.01+rng.Float64()*1.99, 2)
		openPrice := symbolCfg.MinPrice + rng.Float64()*(symbolCfg.MaxPrice-symbolCfg.MinPrice)
		openPrice = round(openPrice, 5)

		openOffset := time.Duration(rng.Intn(90*24)) * time.Hour
		openedAt := now.Add(-openOffset).Add(-time.Duration(rng.Intn(55)) * time.Minute)
		duration := 15*time.Minute + time.Duration(rng.Intn((48*60)-15))*time.Minute
		closedAt := openedAt.Add(duration)

		// 60% winners, 40% losers.
		isWinner := rng.Float64() < 0.60
		movePct := 0.001 + rng.Float64()*0.019 // 0.1% -> 2.0%

		var closePrice float64
		if side == "LONG" {
			if isWinner {
				closePrice = openPrice * (1 + movePct)
			} else {
				closePrice = openPrice * (1 - movePct)
			}
		} else {
			if isWinner {
				closePrice = openPrice * (1 - movePct)
			} else {
				closePrice = openPrice * (1 + movePct)
			}
		}
		closePrice = round(closePrice, 5)

		priceDeltaPct := (closePrice - openPrice) / openPrice
		directional := priceDeltaPct
		if side == "SHORT" {
			directional = -priceDeltaPct
		}
		commission := -round(0.30+rng.Float64()*4.20, 2)
		swap := round((rng.Float64()-0.5)*2.0, 2)
		profit := directional*symbolCfg.PipValue*volume + commission + swap
		profit = round(profit, 2)

		ticket := fmt.Sprintf("SEED-%06d", 100000+i)
		importedAt := now.Add(time.Duration(rng.Intn(60)) * time.Second)
		row := tradeRow{
			AccountID:  accountID,
			Ticket:     ticket,
			Symbol:     symbol,
			Side:       side,
			Volume:     volume,
			OpenPrice:  openPrice,
			ClosePrice: closePrice,
			OpenedAt:   openedAt,
			ClosedAt:   closedAt,
			Commission: commission,
			Swap:       swap,
			Profit:     profit,
			Comment:    comments[rng.Intn(len(comments))],
			ImportedAt: importedAt,
		}
		row.SourceHash = computeSourceHash(row)
		out = append(out, row)
	}
	return out
}

type stats struct {
	Total       int
	Winners     int
	TotalProfit float64
}

func insertTrades(ctx context.Context, pool *pgxpool.Pool, trades []tradeRow) (int, stats, error) {
	const insertQ = `
INSERT INTO mt5_trades (
	account_id,
	ticket,
	symbol,
	side,
	volume,
	open_price,
	close_price,
	opened_at,
	closed_at,
	commission,
	swap,
	profit,
	comment,
	source_hash,
	imported_at
)
VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
ON CONFLICT (account_id, source_hash) DO NOTHING`

	inserted := 0
	st := stats{}
	for _, t := range trades {
		tag, err := pool.Exec(
			ctx,
			insertQ,
			t.AccountID,
			t.Ticket,
			t.Symbol,
			t.Side,
			t.Volume,
			t.OpenPrice,
			t.ClosePrice,
			t.OpenedAt,
			t.ClosedAt,
			t.Commission,
			t.Swap,
			t.Profit,
			t.Comment,
			t.SourceHash,
			t.ImportedAt,
		)
		if err != nil {
			return inserted, st, fmt.Errorf("insert ticket %s: %w", t.Ticket, err)
		}

		if tag.RowsAffected() > 0 {
			inserted++
			st.Total++
			st.TotalProfit += t.Profit
			if t.Profit > 0 {
				st.Winners++
			}
		}

		fmt.Printf("Inserted %d/%d trades\n", inserted, len(trades))
	}
	return inserted, st, nil
}

func computeSourceHash(t tradeRow) string {
	payload := fmt.Sprintf(
		"%s|%s|%s|%s|%.8f|%.8f|%s",
		t.AccountID,
		t.Ticket,
		strings.ToUpper(strings.TrimSpace(t.Symbol)),
		strings.ToUpper(strings.TrimSpace(t.Side)),
		t.Volume,
		t.OpenPrice,
		t.OpenedAt.UTC().Format(time.RFC3339Nano),
	)
	sum := sha256.Sum256([]byte(payload))
	return hex.EncodeToString(sum[:])
}

func round(v float64, precision int) float64 {
	p := 1.0
	for i := 0; i < precision; i++ {
		p *= 10
	}
	return math.Round(v*p) / p
}
