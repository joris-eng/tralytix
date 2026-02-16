package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	identityhttp "github.com/yourname/trading-saas/apps/api/internal/modules/identity/transport/http"
	analyticsusecase "github.com/yourname/trading-saas/apps/api/internal/modules/analytics/usecase"
	platformerrors "github.com/yourname/trading-saas/apps/api/internal/platform/errors"
	"github.com/yourname/trading-saas/apps/api/internal/platform/httpx"
)

type Handler struct {
	uc     *analyticsusecase.UseCase
	authMW *identityhttp.AuthMiddleware
}

func NewHandler(uc *analyticsusecase.UseCase, authMW *identityhttp.AuthMiddleware) *Handler {
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
	userID, ok := identityhttp.AuthUserID(r.Context())
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
