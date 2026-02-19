package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimiter_ExceedsLimit(t *testing.T) {
	rl := NewRateLimiter(2, time.Minute)
	mw := rl.Middleware(func(_ *http.Request) string { return "user-1" })

	h := mw(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/v1/integrations/mt5/analytics/summary", nil)

	rr1 := httptest.NewRecorder()
	h.ServeHTTP(rr1, req)
	if rr1.Code != http.StatusOK {
		t.Fatalf("first request expected 200, got %d", rr1.Code)
	}

	rr2 := httptest.NewRecorder()
	h.ServeHTTP(rr2, req)
	if rr2.Code != http.StatusOK {
		t.Fatalf("second request expected 200, got %d", rr2.Code)
	}

	rr3 := httptest.NewRecorder()
	h.ServeHTTP(rr3, req)
	if rr3.Code != http.StatusTooManyRequests {
		t.Fatalf("third request expected 429, got %d", rr3.Code)
	}
}
