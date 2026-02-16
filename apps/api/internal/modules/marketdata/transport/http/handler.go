package http

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/yourname/trading-saas/apps/api/internal/modules/marketdata/usecase"
	platformerrors "github.com/yourname/trading-saas/apps/api/internal/platform/errors"
	"github.com/yourname/trading-saas/apps/api/internal/platform/httpx"
)

type Handler struct {
	getCandlesUC *usecase.GetCandlesUseCase
}

func NewHandler(getCandlesUC *usecase.GetCandlesUseCase) *Handler {
	return &Handler{getCandlesUC: getCandlesUC}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/marketdata/candles", h.getCandles)
}

func (h *Handler) getCandles(w http.ResponseWriter, r *http.Request) {
	symbol := strings.TrimSpace(r.URL.Query().Get("symbol"))
	asset := strings.TrimSpace(r.URL.Query().Get("asset"))
	tf := strings.TrimSpace(r.URL.Query().Get("tf"))
	fromRaw := strings.TrimSpace(r.URL.Query().Get("from"))
	toRaw := strings.TrimSpace(r.URL.Query().Get("to"))

	from, err := time.Parse(time.RFC3339, fromRaw)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid from datetime, expected RFC3339")
		return
	}
	to, err := time.Parse(time.RFC3339, toRaw)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid to datetime, expected RFC3339")
		return
	}

	candles, err := h.getCandlesUC.Execute(r.Context(), usecase.GetCandlesInput{
		Symbol:    symbol,
		Asset:     asset,
		Timeframe: tf,
		From:      from,
		To:        to,
	})
	if err != nil {
		switch {
		case errors.Is(err, usecase.ErrInvalidSymbol),
			errors.Is(err, usecase.ErrInvalidAsset),
			errors.Is(err, usecase.ErrInvalidTimeframe),
			errors.Is(err, usecase.ErrInvalidRange):
			platformerrors.WriteHTTP(w, http.StatusBadRequest, err.Error())
		default:
			platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]any{
		"count":   len(candles),
		"candles": candles,
	})
}
