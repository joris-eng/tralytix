package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/review/application"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/review/domain"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
	platformerrors "github.com/joris-eng/tralytix/apps/api/internal/platform/errors"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/httpx"
)

type service interface {
	List(ctx context.Context, userID string) (application.ListResult, error)
	Upsert(ctx context.Context, userID string, in application.UpsertInput) (domain.Review, error)
	Delete(ctx context.Context, userID string, tradeID int64) error
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
		sr.Get("/reviews", h.list)
		sr.Put("/reviews/{tradeID}", h.upsert)
		sr.Delete("/reviews/{tradeID}", h.delete)
	})
}

// ---- response types ----

type reviewResp struct {
	ID           string   `json:"id"`
	TradeID      int64    `json:"trade_id"`
	Rating       int      `json:"rating"`
	SetupTag     string   `json:"setup_tag"`
	Notes        string   `json:"notes"`
	KeyLearnings []string `json:"key_learnings"`
	ReviewedAt   string   `json:"reviewed_at"`
}

type tradeResp struct {
	TradeID    int64       `json:"trade_id"`
	Symbol     string      `json:"symbol"`
	Side       string      `json:"side"`
	Profit     float64     `json:"profit"`
	EntryPrice float64     `json:"entry_price"`
	ClosePrice float64     `json:"close_price"`
	OpenedAt   string      `json:"opened_at"`
	ClosedAt   string      `json:"closed_at"`
	Review     *reviewResp `json:"review"`
}

type statsResp struct {
	Reviewed      int     `json:"reviewed"`
	Pending       int     `json:"pending"`
	AvgRating     float64 `json:"avg_rating"`
	TotalInsights int     `json:"total_insights"`
}

type listResp struct {
	Trades []tradeResp `json:"trades"`
	Stats  statsResp   `json:"stats"`
}

type upsertReq struct {
	Rating       int      `json:"rating"`
	SetupTag     string   `json:"setup_tag"`
	Notes        string   `json:"notes"`
	KeyLearnings []string `json:"key_learnings"`
}

func toTradeResp(t domain.TradeWithReview) tradeResp {
	tr := tradeResp{
		TradeID:    t.TradeID,
		Symbol:     t.Symbol,
		Side:       t.Side,
		Profit:     t.Profit,
		EntryPrice: t.EntryPrice,
		ClosePrice: t.ClosePrice,
		OpenedAt:   t.OpenedAt.Format("2006-01-02"),
		ClosedAt:   t.ClosedAt.Format("2006-01-02"),
	}
	if t.Review != nil {
		r := t.Review
		tr.Review = &reviewResp{
			ID:           r.ID,
			TradeID:      r.TradeID,
			Rating:       r.Rating,
			SetupTag:     r.SetupTag,
			Notes:        r.Notes,
			KeyLearnings: r.KeyLearnings,
			ReviewedAt:   r.ReviewedAt.Format("2006-01-02T15:04:05Z"),
		}
	}
	return tr
}

func domainErr(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		platformerrors.WriteError(w, r, http.StatusNotFound, "NOT_FOUND", "not found", nil)
	case errors.Is(err, domain.ErrUnauthorized):
		platformerrors.WriteError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
	case errors.Is(err, domain.ErrInvalidInput):
		platformerrors.WriteError(w, r, http.StatusUnprocessableEntity, "INVALID", "invalid input", nil)
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

	result, err := h.svc.List(r.Context(), userID)
	if err != nil {
		domainErr(w, r, err)
		return
	}

	resp := listResp{
		Trades: make([]tradeResp, 0, len(result.Trades)),
		Stats: statsResp{
			Reviewed:      result.Stats.Reviewed,
			Pending:       result.Stats.Pending,
			AvgRating:     result.Stats.AvgRating,
			TotalInsights: result.Stats.TotalInsights,
		},
	}
	for _, t := range result.Trades {
		resp.Trades = append(resp.Trades, toTradeResp(t))
	}
	httpx.JSON(w, http.StatusOK, resp)
}

func (h *Handler) upsert(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok {
		platformerrors.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized", nil)
		return
	}

	tradeIDStr := chi.URLParam(r, "tradeID")
	tradeID, err := strconv.ParseInt(tradeIDStr, 10, 64)
	if err != nil {
		platformerrors.WriteError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid trade id", nil)
		return
	}

	var req upsertReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		platformerrors.WriteError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid body", nil)
		return
	}

	review, err := h.svc.Upsert(r.Context(), userID, application.UpsertInput{
		TradeID:      tradeID,
		Rating:       req.Rating,
		SetupTag:     req.SetupTag,
		Notes:        req.Notes,
		KeyLearnings: req.KeyLearnings,
	})
	if err != nil {
		domainErr(w, r, err)
		return
	}

	httpx.JSON(w, http.StatusOK, reviewResp{
		ID:           review.ID,
		TradeID:      review.TradeID,
		Rating:       review.Rating,
		SetupTag:     review.SetupTag,
		Notes:        review.Notes,
		KeyLearnings: review.KeyLearnings,
		ReviewedAt:   review.ReviewedAt.Format("2006-01-02T15:04:05Z"),
	})
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok {
		platformerrors.WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized", nil)
		return
	}

	tradeIDStr := chi.URLParam(r, "tradeID")
	tradeID, err := strconv.ParseInt(tradeIDStr, 10, 64)
	if err != nil {
		platformerrors.WriteError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid trade id", nil)
		return
	}

	if err := h.svc.Delete(r.Context(), userID, tradeID); err != nil {
		domainErr(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusNoContent, nil)
}
