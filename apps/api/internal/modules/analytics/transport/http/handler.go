package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	analyticsusecase "github.com/joris-eng/tralytix/apps/api/internal/modules/analytics/usecase"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
	platformerrors "github.com/joris-eng/tralytix/apps/api/internal/platform/errors"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/httpx"
)

type authMiddleware interface {
	RequireAuth(http.Handler) http.Handler
}

type Handler struct {
	uc     *analyticsusecase.UseCase
	authMW authMiddleware
}

func NewHandler(uc *analyticsusecase.UseCase, authMW authMiddleware) *Handler {
	return &Handler{
		uc:     uc,
		authMW: authMW,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Group(func(sr chi.Router) {
		sr.Use(h.authMW.RequireAuth)
		sr.Get("/analytics/summary", h.summary)
	})
}

func (h *Handler) summary(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	summary, err := h.uc.SummaryByUser(r.Context(), userID)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		return
	}

	httpx.JSON(w, http.StatusOK, summary)
}
