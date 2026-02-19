package http

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	identityhttp "github.com/yourname/trading-saas/apps/api/internal/modules/identity/transport/http"
	"github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/application"
	"github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/domain"
	platformerrors "github.com/yourname/trading-saas/apps/api/internal/platform/errors"
	"github.com/yourname/trading-saas/apps/api/internal/platform/httpx"
)

type Handler struct {
	svc            service
	authMW         *identityhttp.AuthMiddleware
	maxUploadBytes int64
	rateLimitMW    func(http.Handler) http.Handler
}

type service interface {
	ImportCSV(ctx context.Context, accountID string, rawCSV []byte) (application.ImportResult, error)
	Status(ctx context.Context, accountID string) (domain.AccountSnapshot, error)
}

func NewHandler(
	svc service,
	authMW *identityhttp.AuthMiddleware,
	maxUploadBytes int64,
	rateLimitMW func(http.Handler) http.Handler,
) *Handler {
	return &Handler{
		svc:            svc,
		authMW:         authMW,
		maxUploadBytes: maxUploadBytes,
		rateLimitMW:    rateLimitMW,
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
	})
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

	userID, ok := identityhttp.AuthUserID(r.Context())
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
	userID, ok := identityhttp.AuthUserID(r.Context())
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
