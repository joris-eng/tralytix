package http

import "github.com/go-chi/chi/v5"

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Group(func(sr chi.Router) {
		sr.Use(h.authMW.RequireAuth)
		sr.Get("/integrations/mt5/analytics/summary", h.mt5Summary)
	})
}
