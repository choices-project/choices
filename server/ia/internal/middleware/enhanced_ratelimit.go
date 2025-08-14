package middleware

import (
	"net/http"
	"sync"
	"time"
)

// EnhancedRateLimiter provides per-user rate limiting with tier-based limits
type EnhancedRateLimiter struct {
	userLimits map[string][]time.Time
	ipLimits   map[string][]time.Time
	mutex      sync.RWMutex
	limits     map[string]RateLimit
}

// RateLimit defines rate limiting rules
type RateLimit struct {
	Requests int
	Window   time.Duration
}

// NewEnhancedRateLimiter creates a new enhanced rate limiter
func NewEnhancedRateLimiter() *EnhancedRateLimiter {
	return &EnhancedRateLimiter{
		userLimits: make(map[string][]time.Time),
		ipLimits:   make(map[string][]time.Time),
		limits: map[string]RateLimit{
			"T0": {Requests: 5, Window: time.Hour},    // Human presence - very limited
			"T1": {Requests: 10, Window: time.Hour},   // WebAuthn - moderate
			"T2": {Requests: 20, Window: time.Hour},   // Personhood - higher
			"T3": {Requests: 50, Window: time.Hour},   // Citizenship - highest
			"IP": {Requests: 100, Window: time.Hour},  // IP-based fallback
		},
	}
}

// isAllowed checks if a request is allowed based on user tier and IP
func (erl *EnhancedRateLimiter) isAllowed(userID, userTier, clientIP string) bool {
	erl.mutex.Lock()
	defer erl.mutex.Unlock()

	now := time.Now()

	// Get limits for user tier
	limit, exists := erl.limits[userTier]
	if !exists {
		limit = erl.limits["T0"] // Default to most restrictive
	}

	// Check user-based rate limit
	if userID != "" {
		windowStart := now.Add(-limit.Window)
		userRequests, exists := erl.userLimits[userID]
		if !exists {
			userRequests = []time.Time{}
		}

		// Filter out old requests
		var validRequests []time.Time
		for _, reqTime := range userRequests {
			if reqTime.After(windowStart) {
				validRequests = append(validRequests, reqTime)
			}
		}

		// Check if user is under limit
		if len(validRequests) < limit.Requests {
			validRequests = append(validRequests, now)
			erl.userLimits[userID] = validRequests
		} else {
			erl.userLimits[userID] = validRequests
			return false
		}
	}

	// Check IP-based rate limit as fallback
	ipLimit := erl.limits["IP"]
	windowStart := now.Add(-ipLimit.Window)
	ipRequests, exists := erl.ipLimits[clientIP]
	if !exists {
		ipRequests = []time.Time{}
	}

	// Filter out old requests
	var validIPRequests []time.Time
	for _, reqTime := range ipRequests {
		if reqTime.After(windowStart) {
			validIPRequests = append(validIPRequests, reqTime)
		}
	}

	// Check if IP is under limit
	if len(validIPRequests) < ipLimit.Requests {
		validIPRequests = append(validIPRequests, now)
		erl.ipLimits[clientIP] = validIPRequests
		return true
	} else {
		erl.ipLimits[clientIP] = validIPRequests
		return false
	}
}

// getRemainingRequests returns the number of remaining requests for a user
func (erl *EnhancedRateLimiter) getRemainingRequests(userID, userTier string) int {
	erl.mutex.RLock()
	defer erl.mutex.RUnlock()

	limit, exists := erl.limits[userTier]
	if !exists {
		limit = erl.limits["T0"]
	}

	now := time.Now()
	windowStart := now.Add(-limit.Window)
	userRequests, exists := erl.userLimits[userID]
	if !exists {
		return limit.Requests
	}

	// Count valid requests
	validCount := 0
	for _, reqTime := range userRequests {
		if reqTime.After(windowStart) {
			validCount++
		}
	}

	return limit.Requests - validCount
}

// EnhancedRateLimitMiddleware creates middleware with per-user rate limiting
func EnhancedRateLimitMiddleware() func(http.Handler) http.Handler {
	limiter := NewEnhancedRateLimiter()
	
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get client IP
			clientIP := r.RemoteAddr
			if forwardedFor := r.Header.Get("X-Forwarded-For"); forwardedFor != "" {
				clientIP = forwardedFor
			}

			// Extract user ID and tier from request
			// In a real implementation, this would come from authentication
			userID := r.Header.Get("X-User-ID")
			userTier := r.Header.Get("X-User-Tier")
			if userTier == "" {
				userTier = "T0" // Default to most restrictive
			}

			// Check rate limit
			if !limiter.isAllowed(userID, userTier, clientIP) {
				remaining := limiter.getRemainingRequests(userID, userTier)
				w.Header().Set("X-RateLimit-Remaining", "0")
				w.Header().Set("X-RateLimit-Reset", time.Now().Add(time.Hour).Format(time.RFC3339))
				http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}

			// Add rate limit headers
			remaining := limiter.getRemainingRequests(userID, userTier)
			w.Header().Set("X-RateLimit-Remaining", string(rune(remaining)))
			w.Header().Set("X-RateLimit-Limit", string(rune(limiter.limits[userTier].Requests)))
			w.Header().Set("X-RateLimit-Window", limiter.limits[userTier].Window.String())

			next.ServeHTTP(w, r)
		})
	}
}

// TokenRateLimitMiddleware creates middleware specifically for token issuance
func TokenRateLimitMiddleware() func(http.Handler) http.Handler {
	limiter := NewEnhancedRateLimiter()
	
	// Override limits for token issuance (more restrictive)
	limiter.limits["T0"] = RateLimit{Requests: 1, Window: time.Hour}
	limiter.limits["T1"] = RateLimit{Requests: 3, Window: time.Hour}
	limiter.limits["T2"] = RateLimit{Requests: 5, Window: time.Hour}
	limiter.limits["T3"] = RateLimit{Requests: 10, Window: time.Hour}
	
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			clientIP := r.RemoteAddr
			if forwardedFor := r.Header.Get("X-Forwarded-For"); forwardedFor != "" {
				clientIP = forwardedFor
			}

			userID := r.Header.Get("X-User-ID")
			userTier := r.Header.Get("X-User-Tier")
			if userTier == "" {
				userTier = "T0"
			}

			if !limiter.isAllowed(userID, userTier, clientIP) {
				remaining := limiter.getRemainingRequests(userID, userTier)
				w.Header().Set("X-RateLimit-Remaining", "0")
				w.Header().Set("X-RateLimit-Reset", time.Now().Add(time.Hour).Format(time.RFC3339))
				http.Error(w, "Token rate limit exceeded", http.StatusTooManyRequests)
				return
			}

			remaining := limiter.getRemainingRequests(userID, userTier)
			w.Header().Set("X-RateLimit-Remaining", string(rune(remaining)))
			w.Header().Set("X-RateLimit-Limit", string(rune(limiter.limits[userTier].Requests)))

			next.ServeHTTP(w, r)
		})
	}
}
