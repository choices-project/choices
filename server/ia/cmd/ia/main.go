package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"choice/ia/internal/api"
	"choice/ia/internal/audit"
	"choice/ia/internal/database"
	"choice/ia/internal/middleware"
	"choice/ia/internal/verification"
	"choice/ia/internal/webauthn"
)

func main() {
	// Initialize database
	db, err := database.NewDatabase("")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Create repositories
	userRepo := database.NewUserRepository(db)
	tokenRepo := database.NewTokenRepository(db)

	// Initialize Phase 7 components
	auditLogger := audit.NewAuditLogger()
	_ = verification.NewAttestationVerifier() // Will be integrated in future updates

	// Create token service
	tokenService, err := api.NewTokenService(userRepo, tokenRepo, auditLogger)
	if err != nil {
		log.Fatalf("Failed to create token service: %v", err)
	}

	// Create WebAuthn service
	webAuthnService, err := webauthn.NewWebAuthnService(userRepo)
	if err != nil {
		log.Fatalf("Failed to create WebAuthn service: %v", err)
	}

	// Create middleware chain
	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})

	// Token issuance endpoint with rate limiting
	mux.HandleFunc("/api/v1/tokens", tokenService.HandleTokenIssuance)

	// Public key endpoint
	mux.HandleFunc("/api/v1/public-key", tokenService.HandlePublicKey)

	// WebAuthn endpoints with rate limiting
	mux.HandleFunc("/api/v1/webauthn/register/begin", webAuthnService.HandleBeginRegistration)
	mux.HandleFunc("/api/v1/webauthn/register/finish", webAuthnService.HandleFinishRegistration)
	mux.HandleFunc("/api/v1/webauthn/login/begin", webAuthnService.HandleBeginLogin)
	mux.HandleFunc("/api/v1/webauthn/login/finish", webAuthnService.HandleFinishLogin)

	// Audit endpoints
	mux.HandleFunc("/api/v1/audit/events", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		events := auditLogger.GetEvents()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"events": events,
		})
	})

	// Apply CORS middleware
	handler := middleware.CORSMiddleware()(
		middleware.LoggingMiddleware()(
			middleware.EnhancedTokenRateLimitMiddleware()(
				mux,
			),
		),
	)

	// Start server
	log.Println("IA service starting on :8081")
	if err := http.ListenAndServe(":8081", handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
