package config

import (
	"fmt"
	"os"
)

type Config struct {
	Name    string
	Version string
	Port    string
	DBDSN   string
}

func Load() (Config, error) {
	cfg := Config{
		Name:    "trading-saas-api",
		Version: "0.1.0",
		Port:    getenv("PORT", "8080"),
		DBDSN:   os.Getenv("DB_DSN"),
	}

	if cfg.Port == "" {
		return Config{}, fmt.Errorf("PORT is required")
	}
	if cfg.DBDSN == "" {
		return Config{}, fmt.Errorf("DB_DSN is required")
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
