package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"time"
)

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(statusCode int) {
	w.status = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

func Logging(logger *slog.Logger) func(http.Handler) http.Handler {
	if logger == nil {
		logger = slog.Default()
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}

			userID := userIDFromContext(r.Context())
			logger.Info("http request start",
				"request_id", GetRequestID(r.Context()),
				"method", r.Method,
				"path", r.URL.Path,
				"user_id", userID,
			)

			next.ServeHTTP(sw, r)

			attrs := []any{
				"request_id", GetRequestID(r.Context()),
				"method", r.Method,
				"path", r.URL.Path,
				"status", sw.status,
				"duration_ms", time.Since(start).Milliseconds(),
				"user_id", userID,
			}
			if sw.status >= http.StatusInternalServerError {
				logger.Error("http request end", attrs...)
				return
			}
			logger.Info("http request end", attrs...)
		})
	}
}

func userIDFromContext(ctx context.Context) string {
	v := ctx.Value("auth_user_id")
	s, ok := v.(string)
	if !ok {
		return ""
	}
	return s
}
