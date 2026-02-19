package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	analyticspostgres "github.com/yourname/trading-saas/apps/api/internal/modules/analytics/data/postgres"
	analyticsdelivery "github.com/yourname/trading-saas/apps/api/internal/modules/analytics/delivery/http"
	analyticstransport "github.com/yourname/trading-saas/apps/api/internal/modules/analytics/transport/http"
	analyticsusecase "github.com/yourname/trading-saas/apps/api/internal/modules/analytics/usecase"
	identitypostgres "github.com/yourname/trading-saas/apps/api/internal/modules/identity/data/postgres"
	identitytransport "github.com/yourname/trading-saas/apps/api/internal/modules/identity/transport/http"
	identityusecase "github.com/yourname/trading-saas/apps/api/internal/modules/identity/usecase"
	mt5csv "github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/adapters/csv"
	mt5postgres "github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/adapters/postgres"
	mt5transport "github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/adapters/http"
	mt5application "github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/application"
	marketdatapostgres "github.com/yourname/trading-saas/apps/api/internal/modules/marketdata/data/postgres"
	marketdatatransport "github.com/yourname/trading-saas/apps/api/internal/modules/marketdata/transport/http"
	marketdatausecase "github.com/yourname/trading-saas/apps/api/internal/modules/marketdata/usecase"
	tradingpostgres "github.com/yourname/trading-saas/apps/api/internal/modules/trading/data/postgres"
	tradingtransport "github.com/yourname/trading-saas/apps/api/internal/modules/trading/transport/http"
	tradingusecase "github.com/yourname/trading-saas/apps/api/internal/modules/trading/usecase"
	"github.com/yourname/trading-saas/apps/api/internal/platform/config"
	"github.com/yourname/trading-saas/apps/api/internal/platform/db"
	"github.com/yourname/trading-saas/apps/api/internal/platform/httpx"
	"github.com/yourname/trading-saas/apps/api/internal/platform/logger"
	platformmiddleware "github.com/yourname/trading-saas/apps/api/internal/platform/middleware"
	"github.com/yourname/trading-saas/apps/api/internal/platform/postgres"
	platformtime "github.com/yourname/trading-saas/apps/api/internal/platform/time"
)

func main() {
	clock := platformtime.RealClock{}

	cfg, err := config.Load()
	if err != nil {
		slog.Error("load config failed", "error", err)
		os.Exit(1)
	}

	log := logger.New(slog.LevelInfo, os.Stdout)
	log = log.With(
		"service", cfg.Name,
		"version", cfg.Version,
		"started_at", clock.Now().Format(time.RFC3339),
	)

	dbClient, err := postgres.Open(context.Background(), cfg.DBDSN)
	if err != nil {
		log.Error("open postgres failed", "error", err)
		os.Exit(1)
	}
	defer dbClient.Close()

	queries := db.New(dbClient.Pool())

	identityRepo := identitypostgres.NewRepository(queries)
	loginDevUC := identityusecase.NewLoginDevUseCase(identityRepo, identityRepo, clock, 24*time.Hour)
	authMW := identitytransport.NewAuthMiddleware(loginDevUC)
	identityHandler := identitytransport.NewHandler(loginDevUC)
	apiRateLimiter := platformmiddleware.NewRateLimiter(cfg.RateLimitRPM, time.Minute)
	authRateLimitMW := apiRateLimiter.Middleware(func(r *http.Request) string {
		if userID, ok := identitytransport.AuthUserID(r.Context()); ok && userID != "" {
			return "user:" + userID
		}
		return ""
	})

	marketdataRepo := marketdatapostgres.NewRepository(queries)
	marketdataUC := marketdatausecase.NewGetCandlesUseCase(marketdataRepo, marketdataRepo)
	marketdataHandler := marketdatatransport.NewHandler(marketdataUC)

	tradingRepo := tradingpostgres.NewRepository(queries)
	tradingUC := tradingusecase.NewUseCase(tradingRepo, clock)
	tradingHandler := tradingtransport.NewHandler(tradingUC, authMW)

	analyticsRepo := analyticspostgres.NewRepository(queries)
	analyticsUC := analyticsusecase.NewUseCase(analyticsRepo)
	analyticsHandler := analyticstransport.NewHandler(analyticsUC, authMW)
	mt5AnalyticsUC := analyticsusecase.NewGetMT5SummaryUseCase(analyticsRepo)
	mt5InsightsUC := analyticsusecase.NewGetMT5InsightsUseCase(mt5AnalyticsUC)
	mt5RecomputeUC := analyticsusecase.NewRecomputeDailyUseCase(analyticsRepo)
	mt5AnalyticsHandler := analyticsdelivery.NewHandler(mt5AnalyticsUC, mt5InsightsUC, mt5RecomputeUC, authMW, authRateLimitMW)

	mt5Repo := mt5postgres.NewRepository(dbClient.Pool())
	mt5Importer := mt5csv.NewImporter()
	mt5UC := mt5application.NewService(mt5Repo, mt5Importer, clock, cfg.MT5ImportMaxRows)
	mt5Handler := mt5transport.NewHandler(mt5UC, authMW, cfg.MT5ImportMaxBytes, authRateLimitMW)

	router := httpx.NewRouter(
		httpx.RouterDeps{
			Logger:         log,
			Name:           cfg.Name,
			Version:        cfg.Version,
			RequestTimeout: time.Duration(cfg.HTTPTimeoutSec) * time.Second,
			HealthCheck: func(ctx context.Context) error {
				return dbClient.Pool().Ping(ctx)
			},
		},
		identityHandler,
		marketdataHandler,
		tradingHandler,
		analyticsHandler,
		mt5AnalyticsHandler,
		mt5Handler,
	)

	server := httpx.NewServer(":"+cfg.Port, router, log)

	serverErr := make(chan error, 1)
	go func() {
		serverErr <- server.Start()
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-stop:
		log.Info("shutdown signal received", "signal", sig.String())
	case err := <-serverErr:
		if err != nil {
			log.Error("server stopped with error", "error", err)
			os.Exit(1)
		}
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Error("graceful shutdown failed", "error", err)
		os.Exit(1)
	}

	log.Info("server stopped gracefully")
}
