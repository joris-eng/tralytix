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
	"strings"
	"testing"
)

type listedPackage struct {
	ImportPath string
	Imports    []string
}

func TestArchitectureGuards(t *testing.T) {
	pkgs := listPackages(t)

	var violations []string

	for _, pkg := range pkgs {
		importer := pkg.ImportPath
		importerModule, hasImporterModule := moduleNameFromImportPath(importer)

		isCompositionRoot :=
			strings.Contains(importer, "/cmd/") ||
				strings.Contains(importer, "/internal/platform/")

		// RULE A: domain must not import platform or module infra
		if domainModule, ok := domainModuleFromImportPath(importer); ok {
			for _, imp := range pkg.Imports {
				if containsPlatformImport(imp) {
					violations = append(violations, fmt.Sprintf(
						"Rule A violated: %s (domain %s) must not import platform package %s",
						importer, domainModule, imp,
					))
				}
				if isModulesInfraImport(imp) {
					violations = append(violations, fmt.Sprintf(
						"Rule A violated: %s (domain %s) must not import module infra package %s",
						importer, domainModule, imp,
					))
				}
			}
		}

		// RULE B: usecase must not import module infra
		if usecaseModule, ok := usecaseModuleFromImportPath(importer); ok {
			for _, imp := range pkg.Imports {
				if isModulesInfraImport(imp) {
					violations = append(violations, fmt.Sprintf(
						"Rule B violated: %s (usecase %s) must not import module infra package %s",
						importer, usecaseModule, imp,
					))
				}
			}
		}

		// RULE C: cross-module data import forbidden (outside composition root)
		for _, imp := range pkg.Imports {
			importedModule, isImportedData := dataModuleFromImportPath(imp)

			if !isImportedData || isCompositionRoot || !hasImporterModule {
				continue
			}

			if importerModule != importedModule {
				violations = append(violations, fmt.Sprintf(
					"Rule C violated: %s must not import cross-module data %s (importer=%s imported=%s)",
					importer, imp, importerModule, importedModule,
				))
			}
		}
	}

	if len(violations) > 0 {
		t.Fatalf("architecture violations:\n- %s", strings.Join(violations, "\n- "))
	}
}

func listPackages(t *testing.T) []listedPackage {
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
		// Strict in CI, permissive locally
		if os.Getenv("CI") == "true" || os.Getenv("GITHUB_ACTIONS") == "true" {
			t.Fatalf("go list failed in CI: %v\n%s", err, string(out))
		}
		t.Skipf("go list skipped locally: %v\n%s", err, string(out))
	}

	dec := json.NewDecoder(bytes.NewReader(out))

	var pkgs []listedPackage
	for {
		var p listedPackage
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

func domainModuleFromImportPath(importPath string) (string, bool) {
	if !hasLayerSegment(importPath, "domain") {
		return "", false
	}
	return moduleNameFromImportPath(importPath)
}

func usecaseModuleFromImportPath(importPath string) (string, bool) {
	if !hasLayerSegment(importPath, "usecase") {
		return "", false
	}
	return moduleNameFromImportPath(importPath)
}

func dataModuleFromImportPath(importPath string) (string, bool) {
	module, ok := moduleNameFromImportPath(importPath)
	if !ok {
		return "", false
	}
	if hasLayerSegment(importPath, "data") {
		return module, true
	}
	return "", false
}

func moduleNameFromImportPath(importPath string) (string, bool) {
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

func containsPlatformImport(importPath string) bool {
	return strings.Contains(importPath, "/internal/platform/")
}

func isModulesInfraImport(importPath string) bool {
	if !strings.Contains(importPath, "/internal/modules/") {
		return false
	}
	return hasLayerSegment(importPath, "data") ||
		hasLayerSegment(importPath, "transport") ||
		hasLayerSegment(importPath, "delivery") ||
		hasLayerSegment(importPath, "adapters")
}

func hasLayerSegment(importPath string, layer string) bool {
	return strings.Contains(importPath, "/"+layer+"/") ||
		strings.HasSuffix(importPath, "/"+layer)
}