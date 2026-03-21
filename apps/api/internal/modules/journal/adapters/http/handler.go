package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/journal/application"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/journal/domain"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
	platformerrors "github.com/joris-eng/tralytix/apps/api/internal/platform/errors"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/httpx"
)

type service interface {
	Create(ctx context.Context, userID string, in application.CreateInput) (domain.Entry, error)
	List(ctx context.Context, userID string) ([]domain.Entry, application.Stats, error)
	Get(ctx context.Context, id, userID string) (domain.Entry, error)
	Update(ctx context.Context, id, userID string, in application.CreateInput) (domain.Entry, error)
	Delete(ctx context.Context, id, userID string) error
}

type authMiddleware interface {
	RequireAuth(http.Handler) http.Handler
}

type Handler struct {
	svc    service
	authMW authMiddleware
}

func NewHandler(svc service, authMW authMiddleware) *Handler {
	return &Handler{svc: svc, authMW: authMW}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Group(func(sr chi.Router) {
		sr.Use(h.authMW.RequireAuth)
		sr.Get("/journal", h.list)
		sr.Post("/journal", h.create)
		sr.Get("/journal/{id}", h.get)
		sr.Put("/journal/{id}", h.update)
		sr.Delete("/journal/{id}", h.delete)
	})
}

// ---- request / response types ----

type entryRequest struct {
	Symbol     string   `json:"symbol"`
	Side       string   `json:"side"`
	Timeframe  string   `json:"timeframe"`
	EntryPrice float64  `json:"entry_price"`
	ClosePrice float64  `json:"close_price"`
	Profit     float64  `json:"profit"`
	OpenedAt   string   `json:"opened_at"`
	Setup      string   `json:"setup"`
	Emotions   []string `json:"emotions"`
	Notes      string   `json:"notes"`
	Lessons    string   `json:"lessons"`
}

type entryResponse struct {
	ID         string   `json:"id"`
	Symbol     string   `json:"symbol"`
	Side       string   `json:"side"`
	Timeframe  string   `json:"timeframe"`
	EntryPrice float64  `json:"entry_price"`
	ClosePrice float64  `json:"close_price"`
	Profit     float64  `json:"profit"`
	OpenedAt   string   `json:"opened_at"`
	Setup      string   `json:"setup"`
	Emotions   []string `json:"emotions"`
	Notes      string   `json:"notes"`
	Lessons    string   `json:"lessons"`
	CreatedAt  string   `json:"created_at"`
	UpdatedAt  string   `json:"updated_at"`
}

type listResponse struct {
	Entries []entryResponse    `json:"entries"`
	Stats   application.Stats  `json:"stats"`
}

func toResponse(e domain.Entry) entryResponse {
	return entryResponse{
		ID:         e.ID,
		Symbol:     e.Symbol,
		Side:       e.Side,
		Timeframe:  e.Timeframe,
		EntryPrice: e.EntryPrice,
		ClosePrice: e.ClosePrice,
		Profit:     e.Profit,
		OpenedAt:   e.OpenedAt.Format("2006-01-02"),
		Setup:      e.Setup,
		Emotions:   e.Emotions,
		Notes:      e.Notes,
		Lessons:    e.Lessons,
		CreatedAt:  e.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:  e.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func domainErr(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		platformerrors.WriteError(w, r, http.StatusNotFound, "NOT_FOUND", "not found", nil)
	case errors.Is(err, domain.ErrUnauthorized):
		platformerrors.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
	case errors.Is(err, domain.ErrInvalidEntry):
		platformerrors.WriteError(w, r, http.StatusUnprocessableEntity, "INVALID", "invalid entry", nil)
	default:
		platformerrors.WriteError(w, r, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
	}
}

// ---- handlers ----

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok {
		platformerrors.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized", nil)
		return
	}

	entries, stats, err := h.svc.List(r.Context(), userID)
	if err != nil {
		domainErr(w, r, err)
		return
	}

	resp := listResponse{
		Entries: make([]entryResponse, 0, len(entries)),
		Stats:   stats,
	}
	for _, e := range entries {
		resp.Entries = append(resp.Entries, toResponse(e))
	}
	httpx.JSON(w, http.StatusOK, resp)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok {
		platformerrors.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized", nil)
		return
	}

	var req entryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		platformerrors.WriteError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid body", nil)
		return
	}

	entry, err := h.svc.Create(r.Context(), userID, application.CreateInput{
		Symbol:     req.Symbol,
		Side:       req.Side,
		Timeframe:  req.Timeframe,
		EntryPrice: req.EntryPrice,
		ClosePrice: req.ClosePrice,
		Profit:     req.Profit,
		OpenedAt:   req.OpenedAt,
		Setup:      req.Setup,
		Emotions:   req.Emotions,
		Notes:      req.Notes,
		Lessons:    req.Lessons,
	})
	if err != nil {
		domainErr(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, toResponse(entry))
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok {
		platformerrors.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized", nil)
		return
	}

	id := chi.URLParam(r, "id")
	entry, err := h.svc.Get(r.Context(), id, userID)
	if err != nil {
		domainErr(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, toResponse(entry))
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok {
		platformerrors.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized", nil)
		return
	}

	id := chi.URLParam(r, "id")
	var req entryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		platformerrors.WriteError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid body", nil)
		return
	}

	entry, err := h.svc.Update(r.Context(), id, userID, application.CreateInput{
		Symbol:     req.Symbol,
		Side:       req.Side,
		Timeframe:  req.Timeframe,
		EntryPrice: req.EntryPrice,
		ClosePrice: req.ClosePrice,
		Profit:     req.Profit,
		OpenedAt:   req.OpenedAt,
		Setup:      req.Setup,
		Emotions:   req.Emotions,
		Notes:      req.Notes,
		Lessons:    req.Lessons,
	})
	if err != nil {
		domainErr(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, toResponse(entry))
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok {
		platformerrors.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized", nil)
		return
	}

	id := chi.URLParam(r, "id")
	if err := h.svc.Delete(r.Context(), id, userID); err != nil {
		domainErr(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusNoContent, nil)
}
