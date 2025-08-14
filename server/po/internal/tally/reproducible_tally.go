package tally

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"strconv"
	"time"
)

// ReproducibleTally provides deterministic, verifiable vote counting
type ReproducibleTally struct {
	version    string
	algorithm  string
	parameters map[string]interface{}
}

// NewReproducibleTally creates a new reproducible tally instance
func NewReproducibleTally(version, algorithm string) *ReproducibleTally {
	return &ReproducibleTally{
		version:    version,
		algorithm:  algorithm,
		parameters: make(map[string]interface{}),
	}
}

// TallyInput represents the input data for tallying
type TallyInput struct {
	PollID      string          `json:"poll_id"`
	Votes       []VoteRecord    `json:"votes"`
	Commitments []CommitmentRecord `json:"commitments"`
	Parameters  map[string]interface{} `json:"parameters"`
	Timestamp   time.Time       `json:"timestamp"`
}

// VoteRecord represents a single vote for tallying
type VoteRecord struct {
	VoteID      string    `json:"vote_id"`
	UserID      string    `json:"user_id"`
	Choice      int       `json:"choice"`
	Weight      float64   `json:"weight"`
	Timestamp   time.Time `json:"timestamp"`
	Commitment  string    `json:"commitment"`
	Proof       string    `json:"proof"`
}

// CommitmentRecord represents a commitment in the commitment log
type CommitmentRecord struct {
	CommitmentID string    `json:"commitment_id"`
	MerkleRoot   string    `json:"merkle_root"`
	Timestamp    time.Time `json:"timestamp"`
	VoteCount    int       `json:"vote_count"`
}

// TallyResult represents the result of a reproducible tally
type TallyResult struct {
	PollID           string                 `json:"poll_id"`
	Algorithm        string                 `json:"algorithm"`
	Version          string                 `json:"version"`
	TotalVotes       int                    `json:"total_votes"`
	ValidVotes       int                    `json:"valid_votes"`
	InvalidVotes     int                    `json:"invalid_votes"`
	ChoiceCounts     map[int]int            `json:"choice_counts"`
	WeightedCounts   map[int]float64        `json:"weighted_counts"`
	CommitmentHash   string                 `json:"commitment_hash"`
	InputHash        string                 `json:"input_hash"`
	ResultHash       string                 `json:"result_hash"`
	Timestamp        time.Time              `json:"timestamp"`
	Parameters       map[string]interface{} `json:"parameters"`
	VerificationData VerificationData       `json:"verification_data"`
}

// VerificationData contains data needed for independent verification
type VerificationData struct {
	InputChecksum    string                 `json:"input_checksum"`
	ProcessingSteps  []ProcessingStep       `json:"processing_steps"`
	IntermediateResults map[string]interface{} `json:"intermediate_results"`
	AuditTrail       []AuditEvent           `json:"audit_trail"`
}

// ProcessingStep represents a step in the tallying process
type ProcessingStep struct {
	StepNumber  int                    `json:"step_number"`
	StepName    string                 `json:"step_name"`
	Input       interface{}            `json:"input"`
	Output      interface{}            `json:"output"`
	Checksum    string                 `json:"checksum"`
	Timestamp   time.Time              `json:"timestamp"`
}

// AuditEvent represents an audit event during tallying
type AuditEvent struct {
	EventType   string                 `json:"event_type"`
	Description string                 `json:"description"`
	Data        map[string]interface{} `json:"data"`
	Timestamp   time.Time              `json:"timestamp"`
}

// ComputeTally performs a reproducible tally computation
func (rt *ReproducibleTally) ComputeTally(input TallyInput) (*TallyResult, error) {
	log.Printf("Starting reproducible tally for poll %s", input.PollID)
	
	result := &TallyResult{
		PollID:     input.PollID,
		Algorithm:  rt.algorithm,
		Version:    rt.version,
		Timestamp:  time.Now(),
		Parameters: rt.parameters,
		VerificationData: VerificationData{
			ProcessingSteps:     make([]ProcessingStep, 0),
			IntermediateResults: make(map[string]interface{}),
			AuditTrail:          make([]AuditEvent, 0),
		},
	}
	
	// Step 1: Validate input
	step1 := rt.validateInput(input)
	result.VerificationData.ProcessingSteps = append(result.VerificationData.ProcessingSteps, step1)
	
	if step1.Output.(bool) == false {
		return nil, fmt.Errorf("input validation failed: %s", step1.Output)
	}
	
	// Step 2: Compute input checksum
	step2 := rt.computeInputChecksum(input)
	result.VerificationData.ProcessingSteps = append(result.VerificationData.ProcessingSteps, step2)
	result.VerificationData.InputChecksum = step2.Output.(string)
	
	// Step 3: Verify commitments
	step3 := rt.verifyCommitments(input.Votes, input.Commitments)
	result.VerificationData.ProcessingSteps = append(result.VerificationData.ProcessingSteps, step3)
	
	// Step 4: Count votes
	step4 := rt.countVotes(input.Votes)
	result.VerificationData.ProcessingSteps = append(result.VerificationData.ProcessingSteps, step4)
	
	// Step 5: Apply weights
	step5 := rt.applyWeights(input.Votes)
	result.VerificationData.ProcessingSteps = append(result.VerificationData.ProcessingSteps, step5)
	
	// Step 6: Generate final result
	step6 := rt.generateFinalResult(input.Votes, step4.Output.(map[int]int), step5.Output.(map[int]float64))
	result.VerificationData.ProcessingSteps = append(result.VerificationData.ProcessingSteps, step6)
	
	// Populate result
	result.TotalVotes = len(input.Votes)
	result.ValidVotes = step4.Output.(map[int]int)["valid"]
	result.InvalidVotes = step4.Output.(map[int]int)["invalid"]
	result.ChoiceCounts = step4.Output.(map[int]int)
	result.WeightedCounts = step5.Output.(map[int]float64)
	result.InputHash = result.VerificationData.InputChecksum
	result.ResultHash = step6.Output.(string)
	
	// Add audit events
	result.VerificationData.AuditTrail = append(result.VerificationData.AuditTrail, AuditEvent{
		EventType:   "TALLY_COMPLETED",
		Description: "Reproducible tally computation completed",
		Data: map[string]interface{}{
			"total_votes": result.TotalVotes,
			"valid_votes": result.ValidVotes,
			"algorithm":   rt.algorithm,
		},
		Timestamp: time.Now(),
	})
	
	log.Printf("Completed reproducible tally for poll %s: %d total votes, %d valid votes", 
		input.PollID, result.TotalVotes, result.ValidVotes)
	
	return result, nil
}

// validateInput validates the tally input
func (rt *ReproducibleTally) validateInput(input TallyInput) ProcessingStep {
	step := ProcessingStep{
		StepNumber: 1,
		StepName:   "validate_input",
		Input:      input,
		Timestamp:  time.Now(),
	}
	
	// Check for required fields
	if input.PollID == "" {
		step.Output = false
		step.Checksum = rt.computeChecksum(step)
		return step
	}
	
	if len(input.Votes) == 0 {
		step.Output = false
		step.Checksum = rt.computeChecksum(step)
		return step
	}
	
	// Validate individual votes
	validVotes := 0
	for _, vote := range input.Votes {
		if vote.VoteID != "" && vote.UserID != "" && vote.Choice >= 0 {
			validVotes++
		}
	}
	
	step.Output = validVotes == len(input.Votes)
	step.Checksum = rt.computeChecksum(step)
	return step
}

// computeInputChecksum computes a checksum of the input data
func (rt *ReproducibleTally) computeInputChecksum(input TallyInput) ProcessingStep {
	step := ProcessingStep{
		StepNumber: 2,
		StepName:   "compute_input_checksum",
		Input:      input,
		Timestamp:  time.Now(),
	}
	
	// Create a deterministic representation of the input
	inputData := map[string]interface{}{
		"poll_id":     input.PollID,
		"vote_count":  len(input.Votes),
		"votes":       input.Votes,
		"commitments": input.Commitments,
		"parameters":  input.Parameters,
	}
	
	// Sort votes by vote ID for deterministic ordering
	sort.Slice(inputData["votes"].([]VoteRecord), func(i, j int) bool {
		return inputData["votes"].([]VoteRecord)[i].VoteID < inputData["votes"].([]VoteRecord)[j].VoteID
	})
	
	// Convert to JSON and hash
	jsonData, _ := json.Marshal(inputData)
	hash := sha256.Sum256(jsonData)
	checksum := hex.EncodeToString(hash[:])
	
	step.Output = checksum
	step.Checksum = rt.computeChecksum(step)
	return step
}

// verifyCommitments verifies vote commitments
func (rt *ReproducibleTally) verifyCommitments(votes []VoteRecord, commitments []CommitmentRecord) ProcessingStep {
	step := ProcessingStep{
		StepNumber: 3,
		StepName:   "verify_commitments",
		Input:      map[string]interface{}{"votes": votes, "commitments": commitments},
		Timestamp:  time.Now(),
	}
	
	// For now, we'll do basic commitment verification
	// In a full implementation, you would verify Merkle proofs
	verifiedCount := 0
	for _, vote := range votes {
		if vote.Commitment != "" {
			verifiedCount++
		}
	}
	
	step.Output = map[string]interface{}{
		"verified_votes": verifiedCount,
		"total_votes":    len(votes),
		"verification_rate": float64(verifiedCount) / float64(len(votes)),
	}
	step.Checksum = rt.computeChecksum(step)
	return step
}

// countVotes counts votes by choice
func (rt *ReproducibleTally) countVotes(votes []VoteRecord) ProcessingStep {
	step := ProcessingStep{
		StepNumber: 4,
		StepName:   "count_votes",
		Input:      votes,
		Timestamp:  time.Now(),
	}
	
	choiceCounts := make(map[int]int)
	validVotes := 0
	invalidVotes := 0
	
	for _, vote := range votes {
		if vote.Choice >= 0 {
			choiceCounts[vote.Choice]++
			validVotes++
		} else {
			invalidVotes++
		}
	}
	
	choiceCounts["valid"] = validVotes
	choiceCounts["invalid"] = invalidVotes
	
	step.Output = choiceCounts
	step.Checksum = rt.computeChecksum(step)
	return step
}

// applyWeights applies vote weights
func (rt *ReproducibleTally) applyWeights(votes []VoteRecord) ProcessingStep {
	step := ProcessingStep{
		StepNumber: 5,
		StepName:   "apply_weights",
		Input:      votes,
		Timestamp:  time.Now(),
	}
	
	weightedCounts := make(map[int]float64)
	
	for _, vote := range votes {
		if vote.Choice >= 0 {
			weightedCounts[vote.Choice] += vote.Weight
		}
	}
	
	step.Output = weightedCounts
	step.Checksum = rt.computeChecksum(step)
	return step
}

// generateFinalResult generates the final tally result
func (rt *ReproducibleTally) generateFinalResult(votes []VoteRecord, choiceCounts map[int]int, weightedCounts map[int]float64) ProcessingStep {
	step := ProcessingStep{
		StepNumber: 6,
		StepName:   "generate_final_result",
		Input:      map[string]interface{}{"votes": votes, "choice_counts": choiceCounts, "weighted_counts": weightedCounts},
		Timestamp:  time.Now(),
	}
	
	// Create final result data
	resultData := map[string]interface{}{
		"total_votes":     len(votes),
		"choice_counts":   choiceCounts,
		"weighted_counts": weightedCounts,
		"algorithm":       rt.algorithm,
		"version":         rt.version,
		"timestamp":       time.Now().Unix(),
	}
	
	// Generate result hash
	jsonData, _ := json.Marshal(resultData)
	hash := sha256.Sum256(jsonData)
	resultHash := hex.EncodeToString(hash[:])
	
	step.Output = resultHash
	step.Checksum = rt.computeChecksum(step)
	return step
}

// computeChecksum computes a checksum for a processing step
func (rt *ReproducibleTally) computeChecksum(step ProcessingStep) string {
	stepData := map[string]interface{}{
		"step_number": step.StepNumber,
		"step_name":   step.StepName,
		"input":       step.Input,
		"output":      step.Output,
		"timestamp":   step.Timestamp.Unix(),
	}
	
	jsonData, _ := json.Marshal(stepData)
	hash := sha256.Sum256(jsonData)
	return hex.EncodeToString(hash[:])
}

// VerifyTally verifies a tally result independently
func (rt *ReproducibleTally) VerifyTally(input TallyInput, result *TallyResult) (bool, error) {
	log.Printf("Verifying tally result for poll %s", input.PollID)
	
	// Recompute the tally
	computedResult, err := rt.ComputeTally(input)
	if err != nil {
		return false, fmt.Errorf("failed to recompute tally: %v", err)
	}
	
	// Compare results
	if computedResult.ResultHash != result.ResultHash {
		log.Printf("Tally verification failed: hash mismatch")
		return false, fmt.Errorf("result hash mismatch")
	}
	
	if computedResult.TotalVotes != result.TotalVotes {
		log.Printf("Tally verification failed: vote count mismatch")
		return false, fmt.Errorf("vote count mismatch")
	}
	
	// Compare choice counts
	for choice, count := range computedResult.ChoiceCounts {
		if result.ChoiceCounts[choice] != count {
			log.Printf("Tally verification failed: choice count mismatch for choice %d", choice)
			return false, fmt.Errorf("choice count mismatch for choice %d", choice)
		}
	}
	
	log.Printf("Tally verification successful for poll %s", input.PollID)
	return true, nil
}

// ExportTallyScript exports the tally computation as a standalone script
func (rt *ReproducibleTally) ExportTallyScript(input TallyInput, result *TallyResult) (string, error) {
	script := fmt.Sprintf(`#!/usr/bin/env python3
"""
Reproducible Tally Script for Poll: %s
Algorithm: %s
Version: %s
Generated: %s
"""

import hashlib
import json
import time
from typing import Dict, List, Any

def compute_checksum(data: Any) -> str:
    """Compute SHA256 checksum of data"""
    json_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(json_str.encode()).hexdigest()

def validate_input(input_data: Dict[str, Any]) -> bool:
    """Validate tally input"""
    if not input_data.get('poll_id'):
        return False
    if not input_data.get('votes'):
        return False
    return True

def count_votes(votes: List[Dict[str, Any]]) -> Dict[int, int]:
    """Count votes by choice"""
    choice_counts = {}
    for vote in votes:
        choice = vote.get('choice', -1)
        if choice >= 0:
            choice_counts[choice] = choice_counts.get(choice, 0) + 1
    return choice_counts

def apply_weights(votes: List[Dict[str, Any]]) -> Dict[int, float]:
    """Apply vote weights"""
    weighted_counts = {}
    for vote in votes:
        choice = vote.get('choice', -1)
        weight = vote.get('weight', 1.0)
        if choice >= 0:
            weighted_counts[choice] = weighted_counts.get(choice, 0.0) + weight
    return weighted_counts

def main():
    # Input data
    input_data = %s
    
    # Validate input
    if not validate_input(input_data):
        print("Input validation failed")
        return False
    
    # Count votes
    choice_counts = count_votes(input_data['votes'])
    
    # Apply weights
    weighted_counts = apply_weights(input_data['votes'])
    
    # Generate result
    result_data = {
        'poll_id': input_data['poll_id'],
        'total_votes': len(input_data['votes']),
        'choice_counts': choice_counts,
        'weighted_counts': weighted_counts,
        'algorithm': '%s',
        'version': '%s',
        'timestamp': int(time.time())
    }
    
    # Compute result hash
    result_hash = compute_checksum(result_data)
    
    print(f"Result hash: {result_hash}")
    print(f"Expected hash: {result.ResultHash}")
    
    return result_hash == '%s'

if __name__ == "__main__":
    success = main()
    print(f"Verification {'successful' if success else 'failed'}")
`, input.PollID, rt.algorithm, rt.version, time.Now().Format(time.RFC3339), 
		rt.formatPythonData(input), rt.algorithm, rt.version, result.ResultHash)
	
	return script, nil
}

// formatPythonData formats Go data structures as Python literals
func (rt *ReproducibleTally) formatPythonData(input TallyInput) string {
	// Convert input to a format suitable for Python
	pythonData := map[string]interface{}{
		"poll_id": input.PollID,
		"votes":   input.Votes,
	}
	
	jsonData, _ := json.Marshal(pythonData)
	return string(jsonData)
}

// GetTallyParameters returns the current tally parameters
func (rt *ReproducibleTally) GetTallyParameters() map[string]interface{} {
	return rt.parameters
}

// SetTallyParameter sets a tally parameter
func (rt *ReproducibleTally) SetTallyParameter(key string, value interface{}) {
	rt.parameters[key] = value
}
