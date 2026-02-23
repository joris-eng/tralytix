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
		isCompositionRoot := strings.Contains(importer, "/cmd/") || strings.Contains(importer, "/internal/platform/")

		if domainModule, ok := domainModuleFromImportPath(importer); ok {
			for _, imp := range pkg.Imports {
				if containsPlatformImport(imp) {
					violations = append(violations, fmt.Sprintf(
						"Rule A violated: %s (domain module %s) must not import platform package %s",
						importer, domainModule, imp,
					))
				}
				if isModulesDataTransportDeliveryAdaptersImport(imp) {
					violations = append(violations, fmt.Sprintf(
						"Rule A violated: %s (domain module %s) must not import module infra package %s",
						importer, domainModule, imp,
					))
				}
			}
		}

		if usecaseModule, ok := usecaseModuleFromImportPath(importer); ok {
			for _, imp := range pkg.Imports {
				if isModulesDataTransportDeliveryAdaptersImport(imp) {
					violations = append(violations, fmt.Sprintf(
						"Rule B violated: %s (usecase module %s) must not import module infra package %s",
						importer, usecaseModule, imp,
					))
				}
			}
		}

		// Conservative guard: we only enforce cross-module data imports when both
		// importer and imported package are module-aware (under /internal/modules/).
		for _, imp := range pkg.Imports {
			importedModule, isImportedModuleData := dataModuleFromImportPath(imp)
			if !isImportedModuleData || isCompositionRoot || !hasImporterModule {
				continue
			}
			if importerModule != importedModule {
				violations = append(violations, fmt.Sprintf(
					"Rule C violated: %s must not import cross-module data package %s (importer module=%s, imported module=%s)",
					importer, imp, importerModule, importedModule,
				))
			}
		}
	}

	if len(violations) > 0 {
		t.Fatalf("architecture guard violations:\n- %s", strings.Join(violations, "\n- "))
	}
}

func listPackages(t *testing.T) []listedPackage {
	t.Helper()

	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot resolve current file path")
	}
	moduleRoot := filepath.Clean(filepath.Join(filepath.Dir(thisFile), ".."))

	cmd := exec.Command("go", "list", "-json", "./...")
	cmd.Dir = moduleRoot
	out, err := cmd.CombinedOutput()
	if err != nil {
		if os.Getenv("CI") == "true" || os.Getenv("GITHUB_ACTIONS") == "true" {
			t.Fatalf("architecture guard failed in CI: go list failed: %v\n%s", err, string(out))
		}
		// Conservative behavior in local/dev: when package listing is unavailable
		// (network/module issue), skip to avoid masking root failures.
		t.Skipf("architecture guard skipped: go list failed: %v\n%s", err, string(out))
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
			t.Fatalf("failed to decode go list output: %v", err)
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
	const modulesPrefix = "/internal/modules/"
	idx := strings.Index(importPath, modulesPrefix)
	if idx < 0 {
		return "", false
	}

	rest := importPath[idx+len(modulesPrefix):]
	parts := strings.Split(rest, "/")
	if len(parts) < 2 {
		return "", false
	}

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
	return strings.Contains(importPath, "/internal/platform/") || strings.HasSuffix(importPath, "/internal/platform")
}

func isModulesDataTransportDeliveryAdaptersImport(importPath string) bool {
	if !strings.Contains(importPath, "/internal/modules/") {
		return false
	}
	return hasLayerSegment(importPath, "data") ||
		hasLayerSegment(importPath, "transport") ||
		hasLayerSegment(importPath, "delivery") ||
		hasLayerSegment(importPath, "adapters")
}

func hasLayerSegment(importPath string, layer string) bool {
	return strings.Contains(importPath, "/"+layer+"/") || strings.HasSuffix(importPath, "/"+layer)
}
