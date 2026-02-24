package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequestID_MissingHeader_GeneratesAndPropagates(t *testing.T) {
	var seen string
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = r.Header.Get("X-Request-ID")
		w.WriteHeader(http.StatusNoContent)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()

	RequestID(next).ServeHTTP(rr, req)

	got := rr.Header().Get("X-Request-ID")
	if got == "" {
		t.Fatalf("expected non-empty X-Request-ID on response")
	}
	if seen == "" {
		t.Fatalf("expected handler to receive non-empty X-Request-ID on request")
	}
	if seen != got {
		t.Fatalf("expected same request/response request id, got request=%q response=%q", seen, got)
	}
}

func TestRequestID_HeaderPresent_PreservesValue(t *testing.T) {
	const reqID = "req-123"

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("X-Request-ID"); got != reqID {
			t.Fatalf("expected request header %q, got %q", reqID, got)
		}
		w.WriteHeader(http.StatusNoContent)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Request-ID", reqID)
	rr := httptest.NewRecorder()

	RequestID(next).ServeHTTP(rr, req)

	if got := rr.Header().Get("X-Request-ID"); got != reqID {
		t.Fatalf("expected response header %q, got %q", reqID, got)
	}
}
