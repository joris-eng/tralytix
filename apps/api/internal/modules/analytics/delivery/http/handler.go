package http

import (
	"net/http"

	identityhttp "github.com/yourname/trading-saas/apps/api/internal/modules/identity/transport/http"
	analyticsusecase "github.com/yourname/trading-saas/apps/api/internal/modules/analytics/usecase"
	platformerrors "github.com/yourname/trading-saas/apps/api/internal/platform/errors"
	"github.com/yourname/trading-saas/apps/api/internal/platform/httpx"
)

type Handler struct {
	summaryUC   *analyticsusecase.GetMT5SummaryUseCase
	insightsUC  *analyticsusecase.GetMT5InsightsUseCase
	recomputeUC *analyticsusecase.RecomputeDailyUseCase
	authMW      *identityhttp.AuthMiddleware
}

func NewHandler(
	summaryUC *analyticsusecase.GetMT5SummaryUseCase,
	insightsUC *analyticsusecase.GetMT5InsightsUseCase,
	recomputeUC *analyticsusecase.RecomputeDailyUseCase,
	authMW *identityhttp.AuthMiddleware,
) *Handler {
	return &Handler{
		summaryUC:   summaryUC,
		insightsUC:  insightsUC,
		recomputeUC: recomputeUC,
		authMW:      authMW,
	}
}

func (h *Handler) mt5Summary(w http.ResponseWriter, r *http.Request) {
	userID, ok := identityhttp.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	summary, err := h.summaryUC.Execute(r.Context(), userID)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		return
	}
	httpx.JSON(w, http.StatusOK, summary)
}

func (h *Handler) mt5Equity(w http.ResponseWriter, r *http.Request) {
	userID, ok := identityhttp.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	equity, err := h.summaryUC.Equity(r.Context(), userID)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		return
	}
	httpx.JSON(w, http.StatusOK, equity)
}

func (h *Handler) recomputeDaily(w http.ResponseWriter, r *http.Request) {
	userID, ok := identityhttp.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	out, err := h.recomputeUC.Execute(r.Context(), userID)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		return
	}
	httpx.JSON(w, http.StatusOK, out)
}

func (h *Handler) mt5Insights(w http.ResponseWriter, r *http.Request) {
	userID, ok := identityhttp.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	out, err := h.insightsUC.Execute(r.Context(), userID)
	if err != nil {
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		return
	}
	httpx.JSON(w, http.StatusOK, out)
}
