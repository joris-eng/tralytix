package domain

type Summary struct {
	TradesCount  int64   `json:"trades_count"`
	Winrate      float64 `json:"winrate"`
	AvgPnL       float64 `json:"avg_pnl"`
	ProfitFactor float64 `json:"profit_factor"`
}
