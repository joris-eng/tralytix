package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	platformerrors "github.com/yourname/trading-saas/apps/api/internal/platform/errors"
)

func Recovery(logger *slog.Logger) func(http.Handler) http.Handler {
	if logger == nil {
		logger = slog.Default()
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					logger.Error("panic recovered",
						"request_id", GetRequestID(r.Context()),
						"path", r.URL.Path,
						"method", r.Method,
						"panic", rec,
						"stack", string(debug.Stack()),
					)
					platformerrors.WriteHTTP(w, http.StatusInternalServerError, "internal server error")
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}
