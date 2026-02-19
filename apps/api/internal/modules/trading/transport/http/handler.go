package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	identityhttp "github.com/yourname/trading-saas/apps/api/internal/modules/identity/transport/http"
	"github.com/yourname/trading-saas/apps/api/internal/modules/trading/usecase"
	platformerrors "github.com/yourname/trading-saas/apps/api/internal/platform/errors"
	"github.com/yourname/trading-saas/apps/api/internal/platform/httpx"
)

type Handler struct {
	uc     *usecase.UseCase
	authMW *identityhttp.AuthMiddleware
}

func NewHandler(uc *usecase.UseCase, authMW *identityhttp.AuthMiddleware) *Handler {
	return &Handler{
		uc:     uc,
		authMW: authMW,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Group(func(sr chi.Router) {
		sr.Use(h.authMW.RequireAuth)
		sr.Post("/trades", h.createTrade)
		sr.Get("/trades", h.listTrades)
	})
}

type createTradeRequest struct {
	InstrumentID string  `json:"instrument_id"`
	Side         string  `json:"side"`
	Qty          float64 `json:"qty"`
	EntryPrice   float64 `json:"entry_price"`
	Fees         float64 `json:"fees"`
	Notes        *string `json:"notes"`
}

func (h *Handler) createTrade(w http.ResponseWriter, r *http.Request) {
	if r.Body == nil || r.Body == http.NoBody {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "request body is required")
		return
	}
	if ct := strings.ToLower(strings.TrimSpace(r.Header.Get("Content-Type"))); !strings.HasPrefix(ct, "application/json") {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "content-type must be application/json")
		return
	}

	userID, ok := identityhttp.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req createTradeRequest
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid json body")
		return
	}

	trade, err := h.uc.CreateTrade(r.Context(), usecase.CreateTradeInput{
		UserID:       userID,
		InstrumentID: req.InstrumentID,
		Side:         req.Side,
		Qty:          req.Qty,
		EntryPrice:   req.EntryPrice,
		Fees:         req.Fees,
		Notes:        req.Notes,
	})
	if err != nil {
		switch {
		case errors.Is(err, usecase.ErrInvalidSide),
			errors.Is(err, usecase.ErrInvalidQty),
			errors.Is(err, usecase.ErrInvalidEntryPrice),
			errors.Is(err, usecase.ErrInvalidInstrument):
			platformerrors.WriteHTTP(w, http.StatusBadRequest, err.Error())
		default:
			platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.JSON(w, http.StatusCreated, trade)
}

func (h *Handler) listTrades(w http.ResponseWriter, r *http.Request) {
	userID, ok := identityhttp.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	limit := int32(50)
	offset := int32(0)

	if raw := r.URL.Query().Get("limit"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil {
			limit = int32(n)
		}
	}
	if raw := r.URL.Query().Get("offset"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil {
			offset = int32(n)
		}
	}
	if limit <= 0 || offset < 0 {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid pagination parameters")
		return
	}

	trades, err := h.uc.ListTradesByUser(r.Context(), userID, limit, offset)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]any{
		"count":  len(trades),
		"trades": trades,
	})
}
