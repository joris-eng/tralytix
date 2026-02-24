package http

import (
	"errors"
	"net/http"
	"strings"

	identityusecase "github.com/joris-eng/tralytix/apps/api/internal/modules/identity/usecase"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
	platformerrors "github.com/joris-eng/tralytix/apps/api/internal/platform/errors"
)

type AuthMiddleware struct {
	loginDevUC *identityusecase.LoginDevUseCase
}

func NewAuthMiddleware(loginDevUC *identityusecase.LoginDevUseCase) *AuthMiddleware {
	return &AuthMiddleware{loginDevUC: loginDevUC}
}

func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			platformerrors.WriteHTTP(w, http.StatusUnauthorized, "missing or invalid authorization header")
			return
		}

		rawToken := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		session, err := m.loginDevUC.Authenticate(r.Context(), rawToken)
		if err != nil {
			if errors.Is(err, identityusecase.ErrInvalidToken) {
				platformerrors.WriteHTTP(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}
			platformerrors.WriteHTTP(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		ctx := authctx.WithAuthUserID(r.Context(), session.UserID.String())
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
