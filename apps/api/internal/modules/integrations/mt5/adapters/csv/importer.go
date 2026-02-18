package csv

import (
	"bytes"
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/domain"
)

var ErrMissingRequiredColumn = errors.New("missing required csv columns")

type Importer struct{}

func NewImporter() *Importer {
	return &Importer{}
}

func (i *Importer) ImportCSV(_ context.Context, data []byte) ([]domain.Trade, error) {
	reader := csv.NewReader(bytes.NewReader(data))
	reader.Comma = detectDelimiter(data)
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true

	rows, err := reader.ReadAll()
	if err != nil {
		if errors.Is(err, io.EOF) {
			return nil, nil
		}
		return nil, fmt.Errorf("read csv: %w", err)
	}
	if len(rows) < 2 {
		return nil, nil
	}

	header := buildHeaderIndex(rows[0])
	if !hasMinimumColumns(header) {
		return nil, ErrMissingRequiredColumn
	}

	out := make([]domain.Trade, 0, len(rows)-1)
	for _, row := range rows[1:] {
		if isEmptyRow(row) {
			continue
		}
		trade, err := parseRow(header, row)
		if err != nil {
			continue
		}
		out = append(out, trade)
	}
	return out, nil
}

func parseRow(header map[string]int, row []string) (domain.Trade, error) {
	ticket := value(row, header, "ticket", "position")
	symbol := value(row, header, "symbol")
	sideRaw := strings.ToLower(value(row, header, "type", "side"))
	volume, err := parseNumber(value(row, header, "volume", "lots"))
	if err != nil {
		return domain.Trade{}, err
	}
	openPrice, err := parseNumber(value(row, header, "price", "openprice", "open_price"))
	if err != nil {
		return domain.Trade{}, err
	}
	openedAt, err := parseTime(value(row, header, "time", "opentime", "open_time"))
	if err != nil {
		return domain.Trade{}, err
	}

	side := strings.ToUpper(strings.TrimSpace(sideRaw))
	if strings.Contains(sideRaw, "buy") || strings.Contains(sideRaw, "long") {
		side = "LONG"
	} else if strings.Contains(sideRaw, "sell") || strings.Contains(sideRaw, "short") {
		side = "SHORT"
	}

	var closePrice *float64
	if raw := value(row, header, "closeprice", "close_price", "price.1"); raw != "" {
		if v, err := parseNumber(raw); err == nil {
			closePrice = &v
		}
	}

	var closedAt *time.Time
	if raw := value(row, header, "closetime", "close_time", "time.1"); raw != "" {
		if v, err := parseTime(raw); err == nil {
			closedAt = &v
		}
	}

	commission := parseNumberOrZero(value(row, header, "commission"))
	swap := parseNumberOrZero(value(row, header, "swap"))
	profit := parseNumberOrZero(value(row, header, "profit"))

	var comment *string
	if c := strings.TrimSpace(value(row, header, "comment")); c != "" {
		comment = &c
	}

	return domain.Trade{
		Ticket:     strings.TrimSpace(ticket),
		Symbol:     strings.TrimSpace(symbol),
		Side:       side,
		Volume:     volume,
		OpenPrice:  openPrice,
		ClosePrice: closePrice,
		OpenedAt:   openedAt,
		ClosedAt:   closedAt,
		Commission: commission,
		Swap:       swap,
		Profit:     profit,
		Comment:    comment,
	}, nil
}

func detectDelimiter(data []byte) rune {
	firstLine := data
	if idx := bytes.IndexByte(data, '\n'); idx >= 0 {
		firstLine = data[:idx]
	}
	if bytes.Count(firstLine, []byte(";")) > bytes.Count(firstLine, []byte(",")) {
		return ';'
	}
	return ','
}

func buildHeaderIndex(header []string) map[string]int {
	out := make(map[string]int, len(header))
	for idx, col := range header {
		k := normalizeHeader(col)
		out[k] = idx
	}
	return out
}

func hasMinimumColumns(header map[string]int) bool {
	_, okTicket := header["ticket"]
	if !okTicket {
		_, okTicket = header["position"]
	}
	_, okSymbol := header["symbol"]
	_, okType := header["type"]
	_, okVolume := header["volume"]
	if !okVolume {
		_, okVolume = header["lots"]
	}
	_, okPrice := header["price"]
	_, okTime := header["time"]
	return okTicket && okSymbol && okType && okVolume && okPrice && okTime
}

func normalizeHeader(v string) string {
	v = strings.ToLower(strings.TrimSpace(v))
	v = strings.ReplaceAll(v, " ", "")
	v = strings.ReplaceAll(v, "_", "")
	return v
}

func value(row []string, header map[string]int, keys ...string) string {
	for _, key := range keys {
		if idx, ok := header[key]; ok && idx < len(row) {
			return strings.TrimSpace(row[idx])
		}
	}
	return ""
}

func parseNumber(raw string) (float64, error) {
	clean := strings.TrimSpace(raw)
	clean = strings.ReplaceAll(clean, " ", "")
	clean = strings.ReplaceAll(clean, ",", ".")
	if clean == "" {
		return 0, fmt.Errorf("empty number")
	}
	v, err := strconv.ParseFloat(clean, 64)
	if err != nil {
		return 0, err
	}
	return v, nil
}

func parseNumberOrZero(raw string) float64 {
	v, err := parseNumber(raw)
	if err != nil {
		return 0
	}
	return v
}

func parseTime(raw string) (time.Time, error) {
	clean := strings.TrimSpace(raw)
	layouts := []string{
		"2006.01.02 15:04:05",
		"2006-01-02 15:04:05",
		time.RFC3339,
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, clean); err == nil {
			return t.UTC(), nil
		}
	}
	return time.Time{}, fmt.Errorf("unsupported time format: %q", raw)
}

func isEmptyRow(row []string) bool {
	for _, col := range row {
		if strings.TrimSpace(col) != "" {
			return false
		}
	}
	return true
}
