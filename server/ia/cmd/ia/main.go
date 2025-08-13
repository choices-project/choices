package main

import (
	"fmt"
	"log"
	"net/http"

	"choice/ia/internal/api"
)

func main() {
	// Create token service
	tokenService, err := api.NewTokenService()
	if err != nil {
		log.Fatalf("Failed to create token service: %v", err)
	}

	// Health check endpoint
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})

	// Token issuance endpoint
	http.HandleFunc("/api/v1/tokens", tokenService.HandleTokenIssuance)

	// Public key endpoint
	http.HandleFunc("/api/v1/public-key", tokenService.HandlePublicKey)

	log.Println("IA listening on :8081")
	log.Println("Available endpoints:")
	log.Println("  GET  /healthz")
	log.Println("  POST /api/v1/tokens")
	log.Println("  GET  /api/v1/public-key")
	
	log.Fatal(http.ListenAndServe(":8081", nil))
}
