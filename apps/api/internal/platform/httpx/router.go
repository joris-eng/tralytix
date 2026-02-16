package httpx

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	platformmiddleware "github.com/yourname/trading-saas/apps/api/internal/platform/middleware"
)

type RouteRegistrar interface {
	RegisterRoutes(r chi.Router)
}

type RouterDeps struct {
	Logger  *slog.Logger
	Name    string
	Version string
}

func NewRouter(deps RouterDeps, handlers ...RouteRegistrar) http.Handler {
	r := chi.NewRouter()
	if deps.Logger == nil {
		deps.Logger = slog.Default()
	}

	r.Use(platformmiddleware.RequestID)
	r.Use(platformmiddleware.Recovery(deps.Logger))
	r.Use(platformmiddleware.Logging(deps.Logger))

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		JSON(w, http.StatusOK, map[string]string{"status": "ok"})
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
