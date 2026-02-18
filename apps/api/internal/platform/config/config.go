package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Name              string
	Version           string
	Port              string
	DBDSN             string
	MT5ImportMaxBytes int64
	MT5ImportMaxRows  int
}

func Load() (Config, error) {
	cfg := Config{
		Name:              "trading-saas-api",
		Version:           "0.1.0",
		Port:              getenv("PORT", "8080"),
		DBDSN:             os.Getenv("DB_DSN"),
		MT5ImportMaxBytes: getenvInt64("MT5_IMPORT_MAX_BYTES", 10*1024*1024),
		MT5ImportMaxRows:  getenvInt("MT5_IMPORT_MAX_ROWS", 20000),
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
