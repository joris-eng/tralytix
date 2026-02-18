package domain

type MT5Summary struct {
	AccountID      string  `json:"account_id"`
	TotalTrades    int64   `json:"total_trades"`
	TotalProfit    string  `json:"total_profit"`
	AvgProfit      string  `json:"avg_profit"`
	Winners        int64   `json:"winners"`
	Losers         int64   `json:"losers"`
	WinRate        string  `json:"win_rate"`
	ProfitFactor   *string `json:"profit_factor"`
	MaxProfit      string  `json:"max_profit"`
	MinProfit      string  `json:"min_profit"`
	LastImportedAt *string `json:"last_imported_at"`
}

type EquityPoint struct {
	Day    string `json:"day"`
	Equity string `json:"equity"`
}

type EquityResponse struct {
	Points []EquityPoint `json:"points"`
}
