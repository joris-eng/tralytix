package errors

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestErrorEnvelopeContract(t *testing.T) {
	rec := httptest.NewRecorder()

	WriteError(rec, nil, http.StatusBadRequest, "BAD_REQUEST", "invalid input", map[string]any{
		"field": "email",
	})

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid json: %v", err)
	}

	errorObj, ok := body["error"].(map[string]any)
	if !ok {
		t.Fatalf("missing 'error' object")
	}

	if errorObj["code"] != "BAD_REQUEST" {
		t.Fatalf("unexpected code: %v", errorObj["code"])
	}

	if errorObj["message"] != "invalid input" {
		t.Fatalf("unexpected message: %v", errorObj["message"])
	}

	if _, exists := errorObj["requestId"]; !exists {
		t.Fatalf("missing requestId field")
	}
}
