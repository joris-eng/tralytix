package http

import "github.com/go-chi/chi/v5"

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Group(func(sr chi.Router) {
		sr.Use(h.authMW.RequireAuth)
		if h.rateLimitMW != nil {
			sr.Use(h.rateLimitMW)
		}
		sr.Get("/integrations/mt5/analytics/summary", h.mt5Summary)
		sr.Get("/integrations/mt5/analytics/insights", h.mt5Insights)
		sr.Get("/integrations/mt5/analytics/equity", h.mt5Equity)
		sr.Post("/integrations/mt5/analytics/recompute-daily", h.recomputeDaily)
	})
}
