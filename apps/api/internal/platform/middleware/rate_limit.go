package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	platformerrors "github.com/yourname/trading-saas/apps/api/internal/platform/errors"
)

type RateLimiter struct {
	limit   int
	window  time.Duration
	mu      sync.Mutex
	buckets map[string]*bucket
}

type bucket struct {
	count       int
	windowStart time.Time
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	if limit <= 0 {
		limit = 100
	}
	if window <= 0 {
		window = time.Minute
	}
	return &RateLimiter{
		limit:   limit,
		window:  window,
		buckets: make(map[string]*bucket),
	}
}

func (rl *RateLimiter) Middleware(keyFn func(*http.Request) string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := clientIP(r)
			if keyFn != nil {
				if k := strings.TrimSpace(keyFn(r)); k != "" {
					key = k
				}
			}

			if !rl.allow(key, time.Now()) {
				platformerrors.WriteHTTP(w, http.StatusTooManyRequests, "rate limit exceeded")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func (rl *RateLimiter) allow(key string, now time.Time) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	b, ok := rl.buckets[key]
	if !ok {
		rl.buckets[key] = &bucket{count: 1, windowStart: now}
		return true
	}

	if now.Sub(b.windowStart) >= rl.window {
		b.count = 1
		b.windowStart = now
		return true
	}

	if b.count >= rl.limit {
		return false
	}
	b.count++
	return true
}

func clientIP(r *http.Request) string {
	if xff := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			ip := strings.TrimSpace(parts[0])
			if ip != "" {
				return ip
			}
		}
	}
	if xrip := strings.TrimSpace(r.Header.Get("X-Real-IP")); xrip != "" {
		return xrip
	}
	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil && host != "" {
		return host
	}
	return strings.TrimSpace(r.RemoteAddr)
}
