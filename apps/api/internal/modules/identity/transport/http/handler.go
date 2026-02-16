package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	identityusecase "github.com/yourname/trading-saas/apps/api/internal/modules/identity/usecase"
	platformerrors "github.com/yourname/trading-saas/apps/api/internal/platform/errors"
	"github.com/yourname/trading-saas/apps/api/internal/platform/httpx"
)

type Handler struct {
	loginDevUC *identityusecase.LoginDevUseCase
}

func NewHandler(loginDevUC *identityusecase.LoginDevUseCase) *Handler {
	return &Handler{loginDevUC: loginDevUC}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/auth/dev-login", h.devLogin)
}

type devLoginRequest struct {
	Email string `json:"email"`
}

type devLoginResponse struct {
	Token string `json:"token"`
}

func (h *Handler) devLogin(w http.ResponseWriter, r *http.Request) {
	var req devLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "invalid json body")
		return
	}

	token, err := h.loginDevUC.LoginDev(r.Context(), strings.TrimSpace(req.Email))
	if err != nil {
		if errors.Is(err, identityusecase.ErrInvalidEmail) {
			platformerrors.WriteHTTP(w, http.StatusBadRequest, err.Error())
			return
		}
		platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
		return
	}

	httpx.JSON(w, http.StatusOK, devLoginResponse{Token: token})
}
