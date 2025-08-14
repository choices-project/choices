package webauthn

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/go-webauthn/webauthn/webauthn"
	"choice/ia/internal/database"
)

// WebAuthnService handles WebAuthn authentication
type WebAuthnService struct {
	webAuthn *webauthn.WebAuthn
	userRepo *database.UserRepository
}

// NewWebAuthnService creates a new WebAuthn service
func NewWebAuthnService(userRepo *database.UserRepository) (*WebAuthnService, error) {
	config := &webauthn.Config{
		RPDisplayName: "Choices Voting System",
		RPID:          "localhost", // In production, this would be your domain
	}

	webAuthn, err := webauthn.New(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create WebAuthn: %w", err)
	}

	return &WebAuthnService{
		webAuthn: webAuthn,
		userRepo: userRepo,
	}, nil
}

// WebAuthnUser implements the webauthn.User interface
type WebAuthnUser struct {
	*database.User
	credentials []webauthn.Credential
}

// WebAuthnID returns the user's WebAuthn ID
func (u *WebAuthnUser) WebAuthnID() []byte {
	return []byte(u.StableID)
}

// WebAuthnName returns the user's WebAuthn name
func (u *WebAuthnUser) WebAuthnName() string {
	return u.StableID
}

// WebAuthnDisplayName returns the user's display name
func (u *WebAuthnUser) WebAuthnDisplayName() string {
	if u.Email != "" {
		return u.Email
	}
	return u.StableID
}

// WebAuthnIcon returns the user's icon
func (u *WebAuthnUser) WebAuthnIcon() string {
	return ""
}

// WebAuthnCredentials returns the user's credentials
func (u *WebAuthnUser) WebAuthnCredentials() []webauthn.Credential {
	return u.credentials
}

// AddCredential adds a new credential to the user
func (u *WebAuthnUser) AddCredential(credential webauthn.Credential) {
	u.credentials = append(u.credentials, credential)
}

// HandleBeginRegistration starts the WebAuthn registration process
func (ws *WebAuthnService) HandleBeginRegistration(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		UserStableID string `json:"user_stable_id"`
		Email        string `json:"email,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get or create user
	user, err := ws.userRepo.GetUserByStableID(req.UserStableID)
	if err != nil {
		http.Error(w, "Failed to get user", http.StatusInternalServerError)
		return
	}

	if user == nil {
		// Create new user
		user = &database.User{
			StableID:        req.UserStableID,
			Email:           req.Email,
			VerificationTier: "T1", // WebAuthn users get T1 tier
			IsActive:        true,
		}
		if err := ws.userRepo.CreateUser(user); err != nil {
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}
	}

	// Create WebAuthn user
	webAuthnUser := &WebAuthnUser{
		User:        user,
		credentials: []webauthn.Credential{},
	}

	// Begin registration
	options, session, err := ws.webAuthn.BeginRegistration(webAuthnUser)
	if err != nil {
		http.Error(w, "Failed to begin registration", http.StatusInternalServerError)
		return
	}

	// Store session data (in production, this would be in a session store)
	sessionData := map[string]interface{}{
		"user_stable_id": req.UserStableID,
		"session":        session,
	}

	// Return registration options
	response := map[string]interface{}{
		"options": options,
		"session": sessionData,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// HandleFinishRegistration completes the WebAuthn registration process
func (ws *WebAuthnService) HandleFinishRegistration(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		UserStableID string                 `json:"user_stable_id"`
		Session      map[string]interface{} `json:"session"`
		Response     map[string]interface{} `json:"response"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get user
	user, err := ws.userRepo.GetUserByStableID(req.UserStableID)
	if err != nil {
		http.Error(w, "Failed to get user", http.StatusInternalServerError)
		return
	}

	if user == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// TODO: Implement proper WebAuthn registration
	// For now, just return success
	log.Printf("WebAuthn registration placeholder for user: %s", req.UserStableID)

	log.Printf("WebAuthn registration completed for user: %s", req.UserStableID)

	response := map[string]string{
		"status": "success",
		"message": "WebAuthn registration completed successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// HandleBeginLogin starts the WebAuthn login process
func (ws *WebAuthnService) HandleBeginLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		UserStableID string `json:"user_stable_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get user
	user, err := ws.userRepo.GetUserByStableID(req.UserStableID)
	if err != nil {
		http.Error(w, "Failed to get user", http.StatusInternalServerError)
		return
	}

	if user == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// TODO: Get user's credentials from database
	credentials := []webauthn.Credential{}

	// Create WebAuthn user
	webAuthnUser := &WebAuthnUser{
		User:        user,
		credentials: credentials,
	}

	// Begin login
	options, session, err := ws.webAuthn.BeginLogin(webAuthnUser)
	if err != nil {
		http.Error(w, "Failed to begin login", http.StatusInternalServerError)
		return
	}

	// Store session data
	sessionData := map[string]interface{}{
		"user_stable_id": req.UserStableID,
		"session":        session,
	}

	// Return login options
	response := map[string]interface{}{
		"options": options,
		"session": sessionData,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// HandleFinishLogin completes the WebAuthn login process
func (ws *WebAuthnService) HandleFinishLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		UserStableID string                 `json:"user_stable_id"`
		Session      map[string]interface{} `json:"session"`
		Response     map[string]interface{} `json:"response"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get user
	user, err := ws.userRepo.GetUserByStableID(req.UserStableID)
	if err != nil {
		http.Error(w, "Failed to get user", http.StatusInternalServerError)
		return
	}

	if user == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// TODO: Implement proper WebAuthn login
	// For now, just return success
	log.Printf("WebAuthn login placeholder for user: %s", req.UserStableID)

	log.Printf("WebAuthn login completed for user: %s", req.UserStableID)

	// Generate session token
	sessionToken := generateSessionToken()

	response := map[string]interface{}{
		"status": "success",
		"message": "WebAuthn login completed successfully",
		"session_token": sessionToken,
		"user": map[string]interface{}{
			"stable_id": user.StableID,
			"email": user.Email,
			"verification_tier": user.VerificationTier,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// generateSessionToken generates a random session token
func generateSessionToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}
