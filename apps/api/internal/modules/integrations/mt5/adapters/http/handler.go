package http

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/application"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/domain"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
	platformerrors "github.com/joris-eng/tralytix/apps/api/internal/platform/errors"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/httpx"
)

type authMiddleware interface {
	RequireAuth(http.Handler) http.Handler
}

type Handler struct {
	svc            service
	authMW         authMiddleware
	maxUploadBytes int64
	rateLimitMW    func(http.Handler) http.Handler
	requireProMW   func(http.Handler) http.Handler
}

type service interface {
	ImportCSV(ctx context.Context, accountID string, rawCSV []byte) (application.ImportResult, error)
	Status(ctx context.Context, accountID string) (domain.AccountSnapshot, error)
	ListTrades(ctx context.Context, accountID string, limit, offset int) (application.TradesResponse, error)
	GetOrCreateEAToken(ctx context.Context, userID string) (string, error)
	LiveSync(ctx context.Context, eaToken string, ev application.LiveSyncEvent) error
}

func NewHandler(
	svc service,
	authMW authMiddleware,
	maxUploadBytes int64,
	rateLimitMW func(http.Handler) http.Handler,
	requireProMW func(http.Handler) http.Handler,
) *Handler {
	return &Handler{
		svc:            svc,
		authMW:         authMW,
		maxUploadBytes: maxUploadBytes,
		rateLimitMW:    rateLimitMW,
		requireProMW:   requireProMW,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Group(func(sr chi.Router) {
		sr.Use(h.authMW.RequireAuth)
		if h.rateLimitMW != nil {
			sr.Use(h.rateLimitMW)
		}
		sr.Post("/integrations/mt5/import", h.importCSV)
		sr.Get("/integrations/mt5/status", h.status)
		sr.Get("/integrations/mt5/ea-token", h.getEAToken)
		if h.requireProMW != nil {
			sr.With(h.requireProMW).Get("/integrations/mt5/trades", h.listTrades)
		} else {
			sr.Get("/integrations/mt5/trades", h.listTrades)
		}
	})
	// EA live sync — no JWT, authenticated by X-EA-Token header
	r.Post("/integrations/mt5/live", h.liveSync)
}

func (h *Handler) importCSV(w http.ResponseWriter, r *http.Request) {
	if r.Body == nil || r.Body == http.NoBody {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "request body is required")
		return
	}
	if !strings.HasPrefix(strings.ToLower(strings.TrimSpace(r.Header.Get("Content-Type"))), "multipart/form-data") {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "content-type must be multipart/form-data")
		return
	}

	userID, ok := authctx.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	if h.maxUploadBytes > 0 {
		r.Body = http.MaxBytesReader(w, r.Body, h.maxUploadBytes)
	}
	if err := r.ParseMultipartForm(h.maxUploadBytes); err != nil {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "missing file field")
		return
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "cannot read uploaded file")
		return
	}

	result, err := h.svc.ImportCSV(r.Context(), userID, content)
	if err != nil {
		switch {
		case errors.Is(err, application.ErrInvalidCSV),
			errors.Is(err, application.ErrInvalidAccount),
			errors.Is(err, application.ErrTooManyRows),
			errors.Is(err, application.ErrImportNoTrades):
			platformerrors.WriteHTTP(w, http.StatusBadRequest, err.Error())
		default:
			platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	httpx.JSON(w, http.StatusOK, result)
}

func (h *Handler) status(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	snapshot, err := h.svc.Status(r.Context(), userID)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		return
	}
	httpx.JSON(w, http.StatusOK, snapshot)
}

type tradeDTO struct {
	Ticket     string     `json:"ticket"`
	Symbol     string     `json:"symbol"`
	Side       string     `json:"side"`
	Volume     float64    `json:"volume"`
	OpenPrice  float64    `json:"open_price"`
	ClosePrice *float64   `json:"close_price,omitempty"`
	Profit     float64    `json:"profit"`
	OpenedAt   string     `json:"opened_at"`
	ClosedAt   *string    `json:"closed_at,omitempty"`
	Commission float64    `json:"commission"`
	Swap       float64    `json:"swap"`
}

type listTradesResponseDTO struct {
	Trades []tradeDTO `json:"trades"`
	Total  int        `json:"total"`
}

func (h *Handler) listTrades(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	limit := 50
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid limit")
			return
		}
		limit = parsed
	}

	offset := 0
	if raw := strings.TrimSpace(r.URL.Query().Get("offset")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid offset")
			return
		}
		offset = parsed
	}

	response, err := h.svc.ListTrades(r.Context(), userID, limit, offset)
	if err != nil {
		switch {
		case errors.Is(err, application.ErrInvalidAccount):
			platformerrors.WriteHTTP(w, http.StatusBadRequest, err.Error())
		default:
			platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	trades := make([]tradeDTO, 0, len(response.Trades))
	for _, t := range response.Trades {
		var closedAt *string
		if t.ClosedAt != nil {
			v := t.ClosedAt.UTC().Format(time.RFC3339)
			closedAt = &v
		}
		trades = append(trades, tradeDTO{
			Ticket:     t.Ticket,
			Symbol:     t.Symbol,
			Side:       t.Side,
			Volume:     t.Volume,
			OpenPrice:  t.OpenPrice,
			ClosePrice: t.ClosePrice,
			Profit:     t.Profit,
			OpenedAt:   t.OpenedAt.UTC().Format(time.RFC3339),
			ClosedAt:   closedAt,
			Commission: t.Commission,
			Swap:       t.Swap,
		})
	}

	httpx.JSON(w, http.StatusOK, listTradesResponseDTO{
		Trades: trades,
		Total:  response.Total,
	})
}

func (h *Handler) getEAToken(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	token, err := h.svc.GetOrCreateEAToken(r.Context(), userID)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "could not get ea token")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"token": token})
}

func (h *Handler) liveSync(w http.ResponseWriter, r *http.Request) {
	eaToken := strings.TrimSpace(r.Header.Get("X-EA-Token"))
	if eaToken == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "X-EA-Token header required")
		return
	}

	var ev application.LiveSyncEvent
	if err := json.NewDecoder(r.Body).Decode(&ev); err != nil {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid json body")
		return
	}

	if err := h.svc.LiveSync(r.Context(), eaToken, ev); err != nil {
		switch {
		case errors.Is(err, application.ErrInvalidEAToken):
			platformerrors.WriteHTTP(w, http.StatusUnauthorized, "invalid ea token")
		case errors.Is(err, application.ErrInvalidAccount):
			platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid account")
		default:
			platformerrors.WriteHTTP(w, http.StatusInternalServerError, "sync failed")
		}
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]bool{"synced": true})
}
