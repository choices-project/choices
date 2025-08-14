package middleware

import (
	"net/http"
	"sync"
	"time"
)

// RateLimiter implements a simple in-memory rate limiter
type RateLimiter struct {
	requests map[string][]time.Time
	mutex    sync.RWMutex
	limit    int
	window   time.Duration
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

// isAllowed checks if a request is allowed based on rate limiting
func (rl *RateLimiter) isAllowed(key string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	// Get existing requests for this key
	requests, exists := rl.requests[key]
	if !exists {
		requests = []time.Time{}
	}

	// Filter out old requests outside the window
	var validRequests []time.Time
	for _, reqTime := range requests {
		if reqTime.After(windowStart) {
			validRequests = append(validRequests, reqTime)
		}
	}

	// Check if we're under the limit
	if len(validRequests) < rl.limit {
		// Add current request
		validRequests = append(validRequests, now)
		rl.requests[key] = validRequests
		return true
	}

	// Update the requests slice even if we're over limit
	rl.requests[key] = validRequests
	return false
}

// RateLimitMiddleware creates a middleware that applies rate limiting
func RateLimitMiddleware(limit int, window time.Duration) func(http.Handler) http.Handler {
	limiter := NewRateLimiter(limit, window)
	
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get client identifier (IP address for now)
			clientIP := r.RemoteAddr
			if forwardedFor := r.Header.Get("X-Forwarded-For"); forwardedFor != "" {
				clientIP = forwardedFor
			}

			// Check rate limit
			if !limiter.isAllowed(clientIP) {
				http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}

			// Add rate limit headers
			w.Header().Set("X-RateLimit-Limit", string(rune(limit)))
			w.Header().Set("X-RateLimit-Window", window.String())

			next.ServeHTTP(w, r)
		})
	}
}

// TokenRateLimitMiddleware applies stricter rate limiting for token issuance
func TokenRateLimitMiddleware() func(http.Handler) http.Handler {
	// Allow 10 tokens per hour per IP
	return RateLimitMiddleware(10, time.Hour)
}

// WebAuthnRateLimitMiddleware applies rate limiting for WebAuthn operations
func WebAuthnRateLimitMiddleware() func(http.Handler) http.Handler {
	// Allow 5 WebAuthn operations per hour per IP
	return RateLimitMiddleware(5, time.Hour)
}
