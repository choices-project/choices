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
	db, err := database.NewDatabase("data/ia.db")
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
		jsonData, err := json.Marshal(events)
		if err != nil {
			http.Error(w, "Failed to marshal events", http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonData)
	})

	mux.HandleFunc("/api/v1/audit/export", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		jsonData, err := auditLogger.ExportAuditLog()
		if err != nil {
			http.Error(w, "Failed to export audit log", http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonData)
	})

	// Apply middleware chain with enhanced rate limiting
	handler := middleware.CORSMiddleware()(
		middleware.LoggingMiddleware()(
			middleware.EnhancedTokenRateLimitMiddleware()(
				mux,
			),
		),
	)

	log.Println("IA listening on :8081")
	log.Println("Available endpoints:")
	log.Println("  GET  /healthz")
	log.Println("  POST /api/v1/tokens")
	log.Println("  GET  /api/v1/public-key")
	log.Println("  POST /api/v1/webauthn/register/begin")
	log.Println("  POST /api/v1/webauthn/register/finish")
	log.Println("  POST /api/v1/webauthn/login/begin")
	log.Println("  POST /api/v1/webauthn/login/finish")
	log.Println("  GET  /api/v1/audit/events")
	log.Println("  GET  /api/v1/audit/export")
	
	log.Fatal(http.ListenAndServe(":8081", handler))
}
