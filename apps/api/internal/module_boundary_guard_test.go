package internal_test

import (
	"strings"
	"testing"
)

func TestModuleBoundaryGuard_NoCrossModuleImports(t *testing.T) {
	pkgs := listPackages(t)

	var violations []string

	for _, pkg := range pkgs {
		importer := pkg.ImportPath

		importerModule, ok := moduleNameFromImportPath(importer)
		if !ok {
			continue
		}

		// Allowed composition roots
		if strings.Contains(importer, "/cmd/") ||
			strings.Contains(importer, "/internal/platform/") {
			continue
		}

		for _, imp := range pkg.Imports {
			importedModule, ok := moduleNameFromImportPath(imp)
			if !ok {
				continue
			}

			if importerModule != importedModule {
				violations = append(violations,
					"Rule MB violated: "+importer+" must not import "+imp+
						" (importer module="+importerModule+", imported module="+importedModule+")",
				)
			}
		}
	}

	if len(violations) > 0 {
		t.Fatalf("module boundary violations:\n- %s", strings.Join(violations, "\n- "))
	}
}