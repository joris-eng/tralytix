package domain

type InsightItem struct {
	Title    string `json:"title"`
	Detail   string `json:"detail"`
	Severity string `json:"severity"`
}

type RecommendedAction struct {
	Title  string `json:"title"`
	Detail string `json:"detail"`
}

type InsightsResponse struct {
	Score             int               `json:"score"`
	Label             string            `json:"label"`
	TopInsights       []InsightItem     `json:"top_insights"`
	RecommendedAction RecommendedAction `json:"recommended_action"`
}
