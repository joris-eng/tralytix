package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	identityusecase "github.com/joris-eng/tralytix/apps/api/internal/modules/identity/usecase"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
	platformerrors "github.com/joris-eng/tralytix/apps/api/internal/platform/errors"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/httpx"
)

type authMiddleware interface {
	RequireAuth(http.Handler) http.Handler
}

type Handler struct {
	loginDevUC     *identityusecase.LoginDevUseCase
	authMW         authMiddleware
	enableDevLogin bool
}

func NewHandler(loginDevUC *identityusecase.LoginDevUseCase, authMW authMiddleware, enableDevLogin bool) *Handler {
	return &Handler{loginDevUC: loginDevUC, authMW: authMW, enableDevLogin: enableDevLogin}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/auth/config", h.authConfig)
	r.Post("/auth/dev-login", h.devLogin)
	r.Group(func(sr chi.Router) {
		sr.Use(h.authMW.RequireAuth)
		sr.Get("/auth/me", h.me)
	})
}

type devLoginRequest struct {
	Email string `json:"email"`
}

type devLoginResponse struct {
	Token string `json:"token"`
}

type meResponse struct {
	UserID string `json:"user_id"`
}

type authConfigResponse struct {
	DevLoginEnabled bool `json:"dev_login_enabled"`
}

func (h *Handler) authConfig(w http.ResponseWriter, _ *http.Request) {
	httpx.JSON(w, http.StatusOK, authConfigResponse{
		DevLoginEnabled: h.enableDevLogin,
	})
}

func (h *Handler) devLogin(w http.ResponseWriter, r *http.Request) {
	if !h.enableDevLogin {
		platformerrors.WriteHTTP(w, http.StatusForbidden, "dev login is disabled")
		return
	}
	if r.Body == nil || r.Body == http.NoBody {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "request body is required")
		return
	}
	if ct := strings.ToLower(strings.TrimSpace(r.Header.Get("Content-Type"))); !strings.HasPrefix(ct, "application/json") {
		platformerrors.WriteHTTP(w, http.StatusBadRequest, "content-type must be application/json")
		return
	}

	var req devLoginRequest
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
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

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.AuthUserID(r.Context())
	if !ok || userID == "" {
		platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	httpx.JSON(w, http.StatusOK, meResponse{UserID: userID})
}
