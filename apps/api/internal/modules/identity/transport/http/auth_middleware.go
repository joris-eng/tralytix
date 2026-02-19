package http

import (
	"context"
	"errors"
	"net/http"
	"strings"

	identityusecase "github.com/yourname/trading-saas/apps/api/internal/modules/identity/usecase"
	platformerrors "github.com/yourname/trading-saas/apps/api/internal/platform/errors"
)

type contextKey string

const authUserIDKey contextKey = "auth_user_id"

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

		ctx := context.WithValue(r.Context(), authUserIDKey, session.UserID.String())
		ctx = context.WithValue(ctx, "auth_user_id", session.UserID.String())
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AuthUserID(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(authUserIDKey).(string)
	return userID, ok
}

func WithAuthUserID(ctx context.Context, userID string) context.Context {
	ctx = context.WithValue(ctx, authUserIDKey, userID)
	return context.WithValue(ctx, "auth_user_id", userID)
}
