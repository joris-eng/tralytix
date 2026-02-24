package authctx

import "context"

type contextKey string

const AuthUserIDKey contextKey = "auth_user_id"

func AuthUserID(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(AuthUserIDKey).(string)
	return userID, ok
}

func WithAuthUserID(ctx context.Context, userID string) context.Context {
	ctx = context.WithValue(ctx, AuthUserIDKey, userID)
	return context.WithValue(ctx, "auth_user_id", userID)
}
