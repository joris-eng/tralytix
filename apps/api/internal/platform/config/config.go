package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Name              string
	Version           string
	Commit            string
	BuiltAt           string
	EnableDevLogin    bool
	StripeSecretKey   string
	StripeWebhookSecret string
	StripePriceMonthly  string
	StripePriceYearly   string
	AppBaseURL          string
	Port              string
	DBDSN             string
	MT5ImportMaxBytes int64
	MT5ImportMaxRows  int
	HTTPTimeoutSec    int
	RateLimitRPM      int
}

func Load() (Config, error) {
	cfg := Config{
		Name:              "trading-saas-api",
		Version:           getenv("APP_VERSION", "0.1.0"),
		Commit:            getenv("APP_COMMIT", "dev"),
		BuiltAt:           getenv("APP_BUILT_AT", "unknown"),
		EnableDevLogin:    getenvBool("ENABLE_DEV_LOGIN", false),
		StripeSecretKey:   os.Getenv("STRIPE_SECRET_KEY"),
		StripeWebhookSecret: os.Getenv("STRIPE_WEBHOOK_SECRET"),
		StripePriceMonthly:  os.Getenv("STRIPE_PRICE_ID_MONTHLY"),
		StripePriceYearly:   os.Getenv("STRIPE_PRICE_ID_YEARLY"),
		AppBaseURL:          getenv("APP_BASE_URL", "http://localhost:3000"),
		Port:              getenv("PORT", "8080"),
		DBDSN:             os.Getenv("DB_DSN"),
		MT5ImportMaxBytes: getenvInt64("MT5_IMPORT_MAX_BYTES", 10*1024*1024),
		MT5ImportMaxRows:  getenvInt("MT5_IMPORT_MAX_ROWS", 20000),
		HTTPTimeoutSec:    getenvInt("HTTP_TIMEOUT_SEC", 15),
		RateLimitRPM:      getenvInt("RATE_LIMIT_RPM", 100),
	}

	if cfg.Port == "" {
		return Config{}, fmt.Errorf("PORT is required")
	}
	if cfg.DBDSN == "" {
		return Config{}, fmt.Errorf("DB_DSN is required")
	}
	if cfg.MT5ImportMaxBytes <= 0 {
		return Config{}, fmt.Errorf("MT5_IMPORT_MAX_BYTES must be > 0")
	}
	if cfg.MT5ImportMaxRows <= 0 {
		return Config{}, fmt.Errorf("MT5_IMPORT_MAX_ROWS must be > 0")
	}
	if cfg.HTTPTimeoutSec <= 0 {
		return Config{}, fmt.Errorf("HTTP_TIMEOUT_SEC must be > 0")
	}
	if cfg.RateLimitRPM <= 0 {
		return Config{}, fmt.Errorf("RATE_LIMIT_RPM must be > 0")
	}

	return cfg, nil
}

func getenv(key, fallback string) string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	return v
}

func getenvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	out, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return out
}

func getenvInt64(key string, fallback int64) int64 {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	out, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		return fallback
	}
	return out
}

func getenvBool(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	out, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return out
}
