package internal_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"testing"
)

type lbListedPackage struct {
	ImportPath string
	Imports    []string
}

func TestLayerBoundaryGuard_NoTransportImportsData(t *testing.T) {
	pkgs := lbListPackages(t)
	sort.Slice(pkgs, func(i, j int) bool {
		return pkgs[i].ImportPath < pkgs[j].ImportPath
	})

	importsByPkg := make(map[string][]string, len(pkgs))
	for _, pkg := range pkgs {
		imports := append([]string(nil), pkg.Imports...)
		sort.Strings(imports)
		importsByPkg[pkg.ImportPath] = imports
	}

	var violations []string

	for _, pkg := range pkgs {
		importer := pkg.ImportPath
		if !lbIsModulesPackage(importer) || !lbIsTransportOrDelivery(importer) {
			continue
		}

		moduleName, ok := lbModuleFromImportPath(importer)
		if !ok {
			continue
		}

		dataPrefix := lbModuleDataPrefix(moduleName)
		seen := map[string]struct{}{importer: {}}
		queue := append([]string(nil), importsByPkg[importer]...)

		for len(queue) > 0 {
			imp := queue[0]
			queue = queue[1:]

			if _, done := seen[imp]; done {
				continue
			}
			seen[imp] = struct{}{}

			if strings.HasPrefix(imp, dataPrefix) {
				violations = append(violations, lbViolationMessage(importer, imp, moduleName))
				continue
			}

			next, ok := importsByPkg[imp]
			if !ok {
				continue
			}
			queue = append(queue, next...)
		}
	}

	if len(violations) > 0 {
		sort.Strings(violations)
		t.Fatalf("layer boundary violations:\n- %s", strings.Join(violations, "\n- "))
	}
}

func lbListPackages(t *testing.T) []lbListedPackage {
	t.Helper()

	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot resolve file path")
	}

	moduleRoot := filepath.Clean(filepath.Join(filepath.Dir(thisFile), ".."))
	cmd := exec.Command("go", "list", "-json", "./...")
	cmd.Dir = moduleRoot

	out, err := cmd.CombinedOutput()
	if err != nil {
		if os.Getenv("CI") == "true" || os.Getenv("GITHUB_ACTIONS") == "true" {
			t.Fatalf("go list failed in CI: %v\n%s", err, string(out))
		}
		t.Skipf("go list skipped locally: %v\n%s", err, string(out))
	}

	dec := json.NewDecoder(bytes.NewReader(out))
	var pkgs []lbListedPackage
	for {
		var p lbListedPackage
		err := dec.Decode(&p)
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatalf("decode error: %v", err)
		}
		pkgs = append(pkgs, p)
	}

	return pkgs
}

func lbModuleFromImportPath(importPath string) (string, bool) {
	const prefix = "/internal/modules/"
	idx := strings.Index(importPath, prefix)
	if idx < 0 {
		return "", false
	}

	rest := importPath[idx+len(prefix):]
	parts := strings.Split(rest, "/")
	layerNames := map[string]struct{}{
		"domain":      {},
		"usecase":     {},
		"data":        {},
		"transport":   {},
		"delivery":    {},
		"adapters":    {},
		"application": {},
		"ports":       {},
	}

	for i, part := range parts {
		if _, ok := layerNames[part]; ok {
			if i == 0 {
				return "", false
			}
			return strings.Join(parts[:i], "/"), true
		}
	}

	return "", false
}

func lbIsModulesPackage(importPath string) bool {
	return strings.Contains(importPath, "/internal/modules/")
}

func lbIsTransportOrDelivery(importPath string) bool {
	return strings.Contains(importPath, "/transport/") ||
		strings.HasSuffix(importPath, "/transport") ||
		strings.Contains(importPath, "/delivery/") ||
		strings.HasSuffix(importPath, "/delivery")
}

func lbModuleDataPrefix(moduleName string) string {
	return "github.com/joris-eng/tralytix/apps/api/internal/modules/" + moduleName + "/data/"
}

func lbViolationMessage(importer, imported, importerModule string) string {
	if importedModule, ok := lbModuleFromImportPath(imported); ok {
		return fmt.Sprintf(
			"Rule LB violated: %s -> %s (importer module=%s, imported module=%s)",
			importer, imported, importerModule, importedModule,
		)
	}
	return fmt.Sprintf(
		"Rule LB violated: %s -> %s (importer module=%s)",
		importer, imported, importerModule,
	)
}
