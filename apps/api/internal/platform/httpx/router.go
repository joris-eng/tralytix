package httpx

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	platformerrors "github.com/joris-eng/tralytix/apps/api/internal/platform/errors"
	platformmiddleware "github.com/joris-eng/tralytix/apps/api/internal/platform/middleware"
)

type RouteRegistrar interface {
	RegisterRoutes(r chi.Router)
}

type RouterDeps struct {
	Logger         *slog.Logger
	Name           string
	Version        string
	RequestTimeout time.Duration
	HealthCheck    func(ctx context.Context) error
}

func NewRouter(deps RouterDeps, handlers ...RouteRegistrar) http.Handler {
	r := chi.NewRouter()
	if deps.Logger == nil {
		deps.Logger = slog.Default()
	}

	r.Use(platformmiddleware.RequestID)
	r.Use(platformmiddleware.Recovery(deps.Logger))
	r.Use(platformmiddleware.Logging(deps.Logger))
	r.Use(platformmiddleware.Timeout(deps.RequestTimeout))

	r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
		ctx, cancel := context.WithTimeout(req.Context(), 2*time.Second)
		defer cancel()

		dbStatus := "ok"
		if deps.HealthCheck != nil {
			if err := deps.HealthCheck(ctx); err != nil {
				dbStatus = "down"
				platformerrors.WriteError(
					w,
					req,
					http.StatusServiceUnavailable,
					"SERVICE_UNAVAILABLE",
					"service degraded",
					map[string]string{
						"status": "degraded",
						"db":     dbStatus,
					},
				)
				return
			}
		}
		JSON(w, http.StatusOK, map[string]string{
			"status": "ok",
			"db":     dbStatus,
		})
	})

	r.Get("/version", func(w http.ResponseWriter, _ *http.Request) {
		JSON(w, http.StatusOK, map[string]string{
			"name":    deps.Name,
			"version": deps.Version,
		})
	})

	r.Route("/v1", func(v1 chi.Router) {
		for _, h := range handlers {
			h.RegisterRoutes(v1)
		}
	})

	return r
}
