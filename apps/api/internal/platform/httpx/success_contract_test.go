package httpx

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSuccessEnvelopeContract(t *testing.T) {
	w := httptest.NewRecorder()

	// Existing helper should keep working: JSON(w, status, payload)
	JSON(w, http.StatusOK, map[string]any{"ok": true})

	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %q", ct)
	}

	var got map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("invalid json body: %v", err)
	}

	// Minimal contract for MVP (strict, but backward-compatible):
	// - JSON must be valid
	// - status code must be respected
	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Payload should be present (whatever shape it is for now).
	if len(got) == 0 {
		t.Fatal("expected non-empty json payload")
	}
}