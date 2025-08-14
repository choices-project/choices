package main

import (
	"fmt"
	"log"
	"net/http"

	"choice/ia/internal/api"
	"choice/ia/internal/database"
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

	// Create token service
	tokenService, err := api.NewTokenService(userRepo, tokenRepo)
	if err != nil {
		log.Fatalf("Failed to create token service: %v", err)
	}

	// Create WebAuthn service
	webAuthnService, err := webauthn.NewWebAuthnService(userRepo)
	if err != nil {
		log.Fatalf("Failed to create WebAuthn service: %v", err)
	}

	// Health check endpoint
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})

	// Token issuance endpoint
	http.HandleFunc("/api/v1/tokens", tokenService.HandleTokenIssuance)

	// Public key endpoint
	http.HandleFunc("/api/v1/public-key", tokenService.HandlePublicKey)

	// WebAuthn endpoints
	http.HandleFunc("/api/v1/webauthn/register/begin", webAuthnService.HandleBeginRegistration)
	http.HandleFunc("/api/v1/webauthn/register/finish", webAuthnService.HandleFinishRegistration)
	http.HandleFunc("/api/v1/webauthn/login/begin", webAuthnService.HandleBeginLogin)
	http.HandleFunc("/api/v1/webauthn/login/finish", webAuthnService.HandleFinishLogin)

	log.Println("IA listening on :8081")
	log.Println("Available endpoints:")
	log.Println("  GET  /healthz")
	log.Println("  POST /api/v1/tokens")
	log.Println("  GET  /api/v1/public-key")
	log.Println("  POST /api/v1/webauthn/register/begin")
	log.Println("  POST /api/v1/webauthn/register/finish")
	log.Println("  POST /api/v1/webauthn/login/begin")
	log.Println("  POST /api/v1/webauthn/login/finish")
	
	log.Fatal(http.ListenAndServe(":8081", nil))
}
