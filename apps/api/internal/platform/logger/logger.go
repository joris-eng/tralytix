package logger

import (
	"io"
	"log/slog"
	"os"
)

func New(level slog.Level, w io.Writer) *slog.Logger {
	if w == nil {
		w = os.Stdout
	}

	handler := slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level: level,
	})

	return slog.New(handler)
}
