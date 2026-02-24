package httpx_test

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestHTTPLayerGuard_NoDirectHTTPWritesOutsidePlatform(t *testing.T) {
	t.Helper()

	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot resolve current file path")
	}

	// thisFile: .../apps/api/internal/platform/httpx/http_layer_guard_test.go
	// internalRoot: .../apps/api/internal
	internalRoot := filepath.Clean(filepath.Join(filepath.Dir(thisFile), "..", ".."))

	allowedWriteHeaderFiles := map[string]struct{}{
		filepath.Join(internalRoot, "platform", "middleware", "logging.go"): {}, // statusWriter wrapper
	}

	// Allowed dirs where direct HTTP writing is expected.
	allowedDirPrefixes := []string{
		filepath.Join(internalRoot, "platform", "httpx") + string(filepath.Separator),
		filepath.Join(internalRoot, "platform", "errors") + string(filepath.Separator),
	}

	// What we forbid outside allowed places.
	forbiddenSnippets := []string{
		"WriteHeader(",
		"json.NewEncoder(",
		".Encode(",
	}

	err := filepath.WalkDir(internalRoot, func(path string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() {
			return nil
		}
		if !strings.HasSuffix(path, ".go") {
			return nil
		}
		if strings.HasSuffix(path, "_test.go") {
			return nil // tests can write headers freely
		}

		b, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		s := string(b)

		// If file is allowed explicitly, skip.
		if _, ok := allowedWriteHeaderFiles[path]; ok {
			return nil
		}

		// If file is under an allowed directory, skip (platform/httpx or platform/errors).
		for _, pfx := range allowedDirPrefixes {
			if strings.HasPrefix(path, pfx) {
				return nil
			}
		}

		// Otherwise enforce: no direct WriteHeader / JSON encode patterns.
		for _, needle := range forbiddenSnippets {
			if strings.Contains(s, needle) {
				t.Fatalf("HTTP layer guard violated: %s contains %q (use platform/httpx.JSON or platform/errors.Write*)", path, needle)
			}
		}

		return nil
	})
	if err != nil {
		t.Fatalf("walk failed: %v", err)
	}
}