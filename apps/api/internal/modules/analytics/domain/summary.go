package domain

type Summary struct {
	TradesCount  int64   `json:"trades_count"`
	Winrate      float64 `json:"winrate"`
	AvgPnL       float64 `json:"avg_pnl"`
	ProfitFactor float64 `json:"profit_factor"`
}

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
