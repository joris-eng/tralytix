package main

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/golang-migrate/migrate/v4"
	migratepostgres "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/joris-eng/tralytix/apps/api/migrations"
	analyticspostgres "github.com/joris-eng/tralytix/apps/api/internal/modules/analytics/data/postgres"
	analyticsdelivery "github.com/joris-eng/tralytix/apps/api/internal/modules/analytics/delivery/http"
	analyticstransport "github.com/joris-eng/tralytix/apps/api/internal/modules/analytics/transport/http"
	analyticsusecase "github.com/joris-eng/tralytix/apps/api/internal/modules/analytics/usecase"
	billingdomain "github.com/joris-eng/tralytix/apps/api/internal/modules/billing/domain"
	billingtransport "github.com/joris-eng/tralytix/apps/api/internal/modules/billing/adapters/http"
	billingpostgres "github.com/joris-eng/tralytix/apps/api/internal/modules/billing/adapters/postgres"
	billingapplication "github.com/joris-eng/tralytix/apps/api/internal/modules/billing/application"
	journaltransport "github.com/joris-eng/tralytix/apps/api/internal/modules/journal/adapters/http"
	journalpostgres "github.com/joris-eng/tralytix/apps/api/internal/modules/journal/adapters/postgres"
	journalapplication "github.com/joris-eng/tralytix/apps/api/internal/modules/journal/application"
	identitypostgres "github.com/joris-eng/tralytix/apps/api/internal/modules/identity/data/postgres"
	identitytransport "github.com/joris-eng/tralytix/apps/api/internal/modules/identity/transport/http"
	identityusecase "github.com/joris-eng/tralytix/apps/api/internal/modules/identity/usecase"
	mt5csv "github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/adapters/csv"
	mt5transport "github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/adapters/http"
	mt5postgres "github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/adapters/postgres"
	mt5application "github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/application"
	marketdatapostgres "github.com/joris-eng/tralytix/apps/api/internal/modules/marketdata/data/postgres"
	marketdatatransport "github.com/joris-eng/tralytix/apps/api/internal/modules/marketdata/transport/http"
	marketdatausecase "github.com/joris-eng/tralytix/apps/api/internal/modules/marketdata/usecase"
	tradingpostgres "github.com/joris-eng/tralytix/apps/api/internal/modules/trading/data/postgres"
	tradingtransport "github.com/joris-eng/tralytix/apps/api/internal/modules/trading/transport/http"
	tradingusecase "github.com/joris-eng/tralytix/apps/api/internal/modules/trading/usecase"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/authctx"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/config"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/db"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/httpx"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/logger"
	platformmiddleware "github.com/joris-eng/tralytix/apps/api/internal/platform/middleware"
	"github.com/joris-eng/tralytix/apps/api/internal/platform/postgres"
	platformtime "github.com/joris-eng/tralytix/apps/api/internal/platform/time"
	_ "github.com/jackc/pgx/v5/stdlib"
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
		"commit", cfg.Commit,
		"built_at", cfg.BuiltAt,
		"started_at", clock.Now().Format(time.RFC3339),
	)

	dbClient, err := postgres.Open(context.Background(), cfg.DBDSN)
	if err != nil {
		log.Error("open postgres failed", "error", err)
		os.Exit(1)
	}
	defer dbClient.Close()

	applied, err := runMigrations(cfg.DBDSN)
	if err != nil {
		log.Error("run migrations failed", "error", err)
		os.Exit(1)
	}
	if applied {
		log.Info("migrations applied")
	} else {
		log.Info("no new migrations")
	}

	queries := db.New(dbClient.Pool())

	identityRepo := identitypostgres.NewRepository(queries)
	loginDevUC := identityusecase.NewLoginDevUseCase(identityRepo, identityRepo, clock, 24*time.Hour)
	authMW := identitytransport.NewAuthMiddleware(loginDevUC)
	identityHandler := identitytransport.NewHandler(loginDevUC, identityRepo, authMW, cfg.EnableDevLogin)
	apiRateLimiter := platformmiddleware.NewRateLimiter(cfg.RateLimitRPM, time.Minute)
	authRateLimitMW := apiRateLimiter.Middleware(func(r *http.Request) string {
		if userID, ok := authctx.AuthUserID(r.Context()); ok && userID != "" {
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

	mt5Repo := mt5postgres.NewRepository(dbClient.Pool())
	mt5Importer := mt5csv.NewImporter()
	mt5UC := mt5application.NewService(mt5Repo, mt5Importer, clock, cfg.MT5ImportMaxRows)

	billingRepo := billingpostgres.NewRepository(dbClient.Pool())
	billingService := billingapplication.NewService(
		billingRepo,
		cfg.StripeSecretKey,
		cfg.StripeWebhookSecret,
		cfg.StripePriceProMonthly,
		cfg.StripePriceProYearly,
		cfg.StripePriceEliteMonthly,
		cfg.StripePriceEliteYearly,
	)
	// Pro routes: accessible by both pro and elite users.
	requirePro := platformmiddleware.RequirePlan(billingRepo, billingdomain.PlanPro, billingdomain.PlanElite)
	mt5AnalyticsHandler := analyticsdelivery.NewHandler(mt5AnalyticsUC, mt5InsightsUC, mt5RecomputeUC, authMW, authRateLimitMW, requirePro)
	mt5Handler := mt5transport.NewHandler(mt5UC, authMW, cfg.MT5ImportMaxBytes, authRateLimitMW, requirePro)
	billingHandler := billingtransport.NewHandler(billingService, authMW, cfg.AppBaseURL)

	journalRepo := journalpostgres.NewRepository(dbClient.Pool())
	journalService := journalapplication.NewService(journalRepo)
	journalHandler := journaltransport.NewHandler(journalService, authMW)

	router := httpx.NewRouter(
		httpx.RouterDeps{
			Logger:         log,
			Name:           cfg.Name,
			Version:        cfg.Version,
			Commit:         cfg.Commit,
			BuiltAt:        cfg.BuiltAt,
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
		billingHandler,
		journalHandler,
	)
	router = platformmiddleware.RequestID(router)

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

func runMigrations(dsn string) (bool, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return false, err
	}
	defer db.Close()

	driver, err := migratepostgres.WithInstance(db, &migratepostgres.Config{})
	if err != nil {
		return false, err
	}

	source, err := iofs.New(migrations.FS, ".")
	if err != nil {
		return false, err
	}

	m, err := migrate.NewWithInstance("iofs", source, "postgres", driver)
	if err != nil {
		return false, err
	}

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
