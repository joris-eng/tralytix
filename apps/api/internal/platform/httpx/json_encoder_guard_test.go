package httpx_test

import (
	"bufio"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"testing"
)

func TestJSONEncoderGuard_OnlyAllowedInHTTPEncodingLayer(t *testing.T) {
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot resolve file path")
	}

	repoRoot := filepath.Clean(filepath.Join(filepath.Dir(thisFile), "../../../../.."))
	internalRoot := filepath.Join(repoRoot, "apps/api/internal")

	allowlist := map[string]struct{}{
		"apps/api/internal/platform/httpx/json.go":   {},
		"apps/api/internal/platform/errors/http.go": {},
	}

	var files []string
	err := filepath.WalkDir(internalRoot, func(path string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() {
			name := d.Name()
			if name == "vendor" || name == ".git" {
				return filepath.SkipDir
			}
			return nil
		}

		if filepath.Ext(path) != ".go" {
			return nil
		}
		if strings.HasSuffix(path, "_test.go") {
			return nil
		}

		files = append(files, path)
		return nil
	})
	if err != nil {
		t.Fatalf("scan internal files: %v", err)
	}
	sort.Strings(files)

	var violations []string
	for _, file := range files {
		relPath, err := filepath.Rel(repoRoot, file)
		if err != nil {
			t.Fatalf("resolve relative path for %q: %v", file, err)
		}
		relPath = filepath.ToSlash(relPath)

		f, err := os.Open(file)
		if err != nil {
			t.Fatalf("open file %q: %v", relPath, err)
		}

		lineNo := 0
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			lineNo++
			if strings.Contains(scanner.Text(), "json.NewEncoder(") {
				if _, allowed := allowlist[relPath]; !allowed {
					violations = append(violations, relPath+":"+strconv.Itoa(lineNo))
				}
			}
		}
		if err := scanner.Err(); err != nil {
			_ = f.Close()
			t.Fatalf("read file %q: %v", relPath, err)
		}
		if err := f.Close(); err != nil {
			t.Fatalf("close file %q: %v", relPath, err)
		}
	}

	sort.Strings(violations)
	if len(violations) > 0 {
		t.Fatalf("json.NewEncoder guard violations (only allowed in apps/api/internal/platform/httpx/json.go and apps/api/internal/platform/errors/http.go):\n- %s", strings.Join(violations, "\n- "))
	}
}
