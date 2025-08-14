package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"choice/po/internal/poll"
	"choice/po/internal/verification"
)

// PollService handles poll management and voting operations
type PollService struct {
	pollManager    *poll.PollManager
	tokenVerifier  *verification.TokenVerifier
	iaPublicKey    string
}

// NewPollService creates a new poll service
func NewPollService(iaPublicKey string) (*PollService, error) {
	tokenVerifier, err := verification.NewTokenVerifier(iaPublicKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create token verifier: %w", err)
	}

	return &PollService{
		pollManager:   poll.NewPollManager(),
		tokenVerifier: tokenVerifier,
		iaPublicKey:   iaPublicKey,
	}, nil
}

// CreatePollRequest represents a request to create a poll
type CreatePollRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Options     []string `json:"options"`
	StartTime   string   `json:"start_time"` // ISO 8601 format
	EndTime     string   `json:"end_time"`   // ISO 8601 format
	Sponsors    []string `json:"sponsors"`
}

// VoteRequest represents a request to submit a vote
type VoteRequest struct {
	Token  string `json:"token"`
	Tag    string `json:"tag"`
	Choice int    `json:"choice"`
}

// HandleCreatePoll handles poll creation requests
func (ps *PollService) HandleCreatePoll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreatePollRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.Title == "" || len(req.Options) < 2 {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Parse times
	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		http.Error(w, "Invalid start time format", http.StatusBadRequest)
		return
	}

	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		http.Error(w, "Invalid end time format", http.StatusBadRequest)
		return
	}

	// Create poll
	poll, err := ps.pollManager.CreatePoll(
		req.Title,
		req.Description,
		req.Options,
		startTime,
		endTime,
		req.Sponsors,
		ps.iaPublicKey,
	)
	if err != nil {
		http.Error(w, "Failed to create poll", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(poll)
}

// HandleGetPoll handles poll retrieval requests
func (ps *PollService) HandleGetPoll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pollID := r.URL.Query().Get("id")
	if pollID == "" {
		http.Error(w, "Missing poll ID", http.StatusBadRequest)
		return
	}

	poll, err := ps.pollManager.GetPoll(pollID)
	if err != nil {
		http.Error(w, "Poll not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(poll)
}

// HandleListPolls handles poll listing requests
func (ps *PollService) HandleListPolls(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	polls := ps.pollManager.ListPolls()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(polls)
}

// HandleSubmitVote handles vote submission requests
func (ps *PollService) HandleSubmitVote(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pollID := r.URL.Query().Get("poll_id")
	if pollID == "" {
		http.Error(w, "Missing poll ID", http.StatusBadRequest)
		return
	}

	var req VoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.Token == "" || req.Tag == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Get poll to verify it exists
	_, err := ps.pollManager.GetPoll(pollID)
	if err != nil {
		http.Error(w, "Poll not found", http.StatusNotFound)
		return
	}

	// For now, we'll use a simplified verification
	// In a real implementation, we'd extract the user ID from the token
	// and verify it matches the expected tag for that user and poll
	
	// Submit vote
	vote, err := ps.pollManager.SubmitVote(pollID, req.Token, req.Tag, req.Choice)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to submit vote: %v", err), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(vote)
}

// HandleGetTally handles vote tally requests
func (ps *PollService) HandleGetTally(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pollID := r.URL.Query().Get("poll_id")
	if pollID == "" {
		http.Error(w, "Missing poll ID", http.StatusBadRequest)
		return
	}

	tally, err := ps.pollManager.GetTally(pollID)
	if err != nil {
		http.Error(w, "Failed to get tally", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(tally)
}

// HandleActivatePoll handles poll activation requests
func (ps *PollService) HandleActivatePoll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pollID := r.URL.Query().Get("poll_id")
	if pollID == "" {
		http.Error(w, "Missing poll ID", http.StatusBadRequest)
		return
	}

	err := ps.pollManager.ActivatePoll(pollID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to activate poll: %v", err), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Poll activated successfully"))
}

// HandleClosePoll handles poll closing requests
func (ps *PollService) HandleClosePoll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pollID := r.URL.Query().Get("poll_id")
	if pollID == "" {
		http.Error(w, "Missing poll ID", http.StatusBadRequest)
		return
	}

	err := ps.pollManager.ClosePoll(pollID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to close poll: %v", err), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Poll closed successfully"))
}

// HandleGetCommitmentLog handles commitment log requests
func (ps *PollService) HandleGetCommitmentLog(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pollID := r.URL.Query().Get("poll_id")
	if pollID == "" {
		http.Error(w, "Missing poll ID", http.StatusBadRequest)
		return
	}

	log, err := ps.pollManager.GetCommitmentLog(pollID)
	if err != nil {
		http.Error(w, "Failed to get commitment log", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(log)
}

// HandleVerifyProof handles proof verification requests
func (ps *PollService) HandleVerifyProof(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pollID := r.URL.Query().Get("poll_id")
	if pollID == "" {
		http.Error(w, "Missing poll ID", http.StatusBadRequest)
		return
	}

	var req struct {
		MerkleLeaf string   `json:"merkle_leaf"`
		MerkleProof []string `json:"merkle_proof"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.MerkleLeaf == "" {
		http.Error(w, "Missing merkle leaf", http.StatusBadRequest)
		return
	}

	valid, err := ps.pollManager.VerifyVoteProof(pollID, req.MerkleLeaf, req.MerkleProof)
	if err != nil {
		http.Error(w, "Failed to verify proof", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"valid": valid,
		"poll_id": pollID,
		"merkle_leaf": req.MerkleLeaf,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
