package api

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"choice/ia/internal/audit"
	"choice/ia/internal/database"
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
	voprf           *voprf.VOPRF
	userRepo        *database.UserRepository
	tokenRepo       *database.TokenRepository
	auditLogger     *audit.AuditLogger
}

// NewTokenService creates a new token service
func NewTokenService(userRepo *database.UserRepository, tokenRepo *database.TokenRepository, auditLogger *audit.AuditLogger) (*TokenService, error) {
	voprfInstance, err := voprf.NewVOPRF()
	if err != nil {
		return nil, fmt.Errorf("failed to create VOPRF instance: %w", err)
	}

	return &TokenService{
		voprf:       voprfInstance,
		userRepo:    userRepo,
		tokenRepo:   tokenRepo,
		auditLogger: auditLogger,
	}, nil
}

// HandleTokenIssuance handles token issuance requests
func (ts *TokenService) HandleTokenIssuance(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get client information for audit logging
	clientIP := r.RemoteAddr
	if forwardedFor := r.Header.Get("X-Forwarded-For"); forwardedFor != "" {
		clientIP = forwardedFor
	}
	userAgent := r.Header.Get("User-Agent")
	userID := r.Header.Get("X-User-ID")
	userTier := r.Header.Get("X-User-Tier")

	// Parse request
	var req TokenIssuanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// Log failed request
		if ts.auditLogger != nil {
			ts.auditLogger.LogTokenIssuance(userID, userTier, req.PollID, clientIP, userAgent, false, "Invalid request body")
		}
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

	// Check if user exists, create if not
	user, err := ts.userRepo.GetUserByStableID(req.UserStableID)
	if err != nil {
		log.Printf("Error getting user: %v", err)
		http.Error(w, "Failed to check user", http.StatusInternalServerError)
		return
	}

	if user == nil {
		// Create new user
		user = &database.User{
			StableID:        req.UserStableID,
			VerificationTier: req.Tier,
			IsActive:        true,
		}
		if err := ts.userRepo.CreateUser(user); err != nil {
			log.Printf("Error creating user: %v", err)
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}
		log.Printf("Created user: %s", req.UserStableID)
	}

	// Generate per-poll tag using VOPRF
	tag, err := ts.voprf.GeneratePerPollTag([]byte(req.UserStableID), []byte(req.PollID))
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Create token hash for storage
	tokenHash := sha256.Sum256(tag)
	tokenHashHex := hex.EncodeToString(tokenHash[:])

	// Store token in database
	now := time.Now()
	dbToken := &database.Token{
		UserStableID: req.UserStableID,
		PollID:       req.PollID,
		TokenHash:    tokenHashHex,
		Tag:          fmt.Sprintf("%x", tag),
		Tier:         req.Tier,
		Scope:        req.Scope,
		ExpiresAt:    now.Add(24 * time.Hour),
	}

	if err := ts.tokenRepo.CreateToken(dbToken); err != nil {
		log.Printf("Error creating token: %v", err)
		http.Error(w, "Failed to store token", http.StatusInternalServerError)
		return
	}
	log.Printf("Created token for user: %s, poll: %s", req.UserStableID, req.PollID)

	// Create response
	response := TokenIssuanceResponse{
		Token:     fmt.Sprintf("%x", tag), // Use tag as token for now
		Tag:       fmt.Sprintf("%x", tag),
		IssuedAt:  now,
		ExpiresAt: now.Add(24 * time.Hour), // Tokens expire in 24 hours
		Tier:      req.Tier,
		Scope:     req.Scope,
		PublicKey: fmt.Sprintf("%x", ts.voprf.GetPublicKey()),
	}

	// Log successful token issuance
	if ts.auditLogger != nil {
		ts.auditLogger.LogTokenIssuance(req.UserStableID, req.Tier, req.PollID, clientIP, userAgent, true, "")
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
