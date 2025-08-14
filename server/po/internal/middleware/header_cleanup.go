package middleware

import (
	"net/http"
)

// HeaderCleanupMiddleware removes problematic headers that cause proxy issues
func HeaderCleanupMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Create a custom response writer that filters headers
			cleanWriter := &headerCleanupWriter{
				ResponseWriter: w,
			}
			
			next.ServeHTTP(cleanWriter, r)
		})
	}
}

// headerCleanupWriter wraps http.ResponseWriter to filter headers
type headerCleanupWriter struct {
	http.ResponseWriter
}

func (hw *headerCleanupWriter) WriteHeader(statusCode int) {
	// Remove problematic headers before writing
	hw.ResponseWriter.Header().Del("X-Ratelimit-Limit")
	hw.ResponseWriter.Header().Del("X-Ratelimit-Window")
	hw.ResponseWriter.WriteHeader(statusCode)
}

func (hw *headerCleanupWriter) Write(data []byte) (int, error) {
	return hw.ResponseWriter.Write(data)
}
