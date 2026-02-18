package http

import (
	"net/http"

	identityhttp "github.com/yourname/trading-saas/apps/api/internal/modules/identity/transport/http"
	analyticsusecase "github.com/yourname/trading-saas/apps/api/internal/modules/analytics/usecase"
	platformerrors "github.com/yourname/trading-saas/apps/api/internal/platform/errors"
	"github.com/yourname/trading-saas/apps/api/internal/platform/httpx"
)

type Handler struct {
	uc     *analyticsusecase.GetMT5SummaryUseCase
	authMW *identityhttp.AuthMiddleware
}

func NewHandler(uc *analyticsusecase.GetMT5SummaryUseCase, authMW *identityhttp.AuthMiddleware) *Handler {
	return &Handler{
		uc:     uc,
		authMW: authMW,
	}
}

func (h *Handler) mt5Summary(w http.ResponseWriter, r *http.Request) {
	userID, ok := identityhttp.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	summary, err := h.uc.Execute(r.Context(), userID)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		return
	}
	httpx.JSON(w, http.StatusOK, summary)
}
