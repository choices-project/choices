package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"choice/ia/internal/voprf"
)

// TokenIssuanceRequest represents a request for token issuance
type TokenIssuanceRequest struct {
	UserStableID string `json:"user_stable_id"`
	PollID       string `json:"poll_id"`
	Tier         string `json:"tier"`
	Scope        string `json:"scope"`
}

// TokenIssuanceResponse represents the response from token issuance
type TokenIssuanceResponse struct {
	Token        string    `json:"token"`
	Tag          string    `json:"tag"`
	IssuedAt     time.Time `json:"issued_at"`
	ExpiresAt    time.Time `json:"expires_at"`
	Tier         string    `json:"tier"`
	Scope        string    `json:"scope"`
	PublicKey    string    `json:"public_key"`
}

// TokenService handles token issuance operations
type TokenService struct {
	voprf *voprf.VOPRF
}

// NewTokenService creates a new token service
func NewTokenService() (*TokenService, error) {
	voprfInstance, err := voprf.NewVOPRF()
	if err != nil {
		return nil, fmt.Errorf("failed to create VOPRF instance: %w", err)
	}

	return &TokenService{
		voprf: voprfInstance,
	}, nil
}

// HandleTokenIssuance handles token issuance requests
func (ts *TokenService) HandleTokenIssuance(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request
	var req TokenIssuanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.UserStableID == "" || req.PollID == "" || req.Tier == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Validate tier
	if !isValidTier(req.Tier) {
		http.Error(w, "Invalid tier", http.StatusBadRequest)
		return
	}

	// Generate per-poll tag using VOPRF
	tag, err := ts.voprf.GeneratePerPollTag([]byte(req.UserStableID), []byte(req.PollID))
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Create response
	now := time.Now()
	response := TokenIssuanceResponse{
		Token:     fmt.Sprintf("%x", tag), // Use tag as token for now
		Tag:       fmt.Sprintf("%x", tag),
		IssuedAt:  now,
		ExpiresAt: now.Add(24 * time.Hour), // Tokens expire in 24 hours
		Tier:      req.Tier,
		Scope:     req.Scope,
		PublicKey: fmt.Sprintf("%x", ts.voprf.GetPublicKey()),
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// HandlePublicKey returns the public key for verification
func (ts *TokenService) HandlePublicKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	response := map[string]string{
		"public_key": fmt.Sprintf("%x", ts.voprf.GetPublicKey()),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// isValidTier validates that the tier is one of the supported tiers
func isValidTier(tier string) bool {
	validTiers := map[string]bool{
		"T0": true, // Human presence
		"T1": true, // WebAuthn/Passkey
		"T2": true, // Personhood verification
		"T3": true, // Citizenship/residency
	}
	return validTiers[tier]
}
