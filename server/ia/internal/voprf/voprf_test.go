package voprf

import (
	"encoding/hex"
	"testing"
)

func TestNewVOPRF(t *testing.T) {
	voprf, err := NewVOPRF()
	if err != nil {
		t.Fatalf("Failed to create VOPRF: %v", err)
	}

	if voprf == nil {
		t.Fatal("VOPRF instance is nil")
	}

	if voprf.sk == nil {
		t.Fatal("Private key is nil")
	}

	if voprf.pk == nil {
		t.Fatal("Public key is nil")
	}

	if len(voprf.pk) != 32 {
		t.Fatalf("Expected public key length 32, got %d", len(voprf.pk))
	}
}

func TestBlindAndEvaluate(t *testing.T) {
	voprf, err := NewVOPRF()
	if err != nil {
		t.Fatalf("Failed to create VOPRF: %v", err)
	}

	input := []byte("test input")
	
	// Blind the input
	blindInput, err := voprf.Blind(input)
	if err != nil {
		t.Fatalf("Failed to blind input: %v", err)
	}

	if blindInput == nil {
		t.Fatal("BlindInput is nil")
	}

	if len(blindInput.BlindedElement) != 32 {
		t.Fatalf("Expected blinded element length 32, got %d", len(blindInput.BlindedElement))
	}

	// Evaluate the blinded input
	evalResult, err := voprf.Evaluate(blindInput.BlindedElement)
	if err != nil {
		t.Fatalf("Failed to evaluate blinded input: %v", err)
	}

	if evalResult == nil {
		t.Fatal("EvaluationResult is nil")
	}

	if len(evalResult.EvaluatedElement) != 32 {
		t.Fatalf("Expected evaluated element length 32, got %d", len(evalResult.EvaluatedElement))
	}

	if evalResult.Proof == nil {
		t.Fatal("Proof is nil")
	}
}

func TestUnblind(t *testing.T) {
	voprf, err := NewVOPRF()
	if err != nil {
		t.Fatalf("Failed to create VOPRF: %v", err)
	}

	input := []byte("test input for unblinding")
	
	// Blind the input
	blindInput, err := voprf.Blind(input)
	if err != nil {
		t.Fatalf("Failed to blind input: %v", err)
	}

	// Evaluate the blinded input
	evalResult, err := voprf.Evaluate(blindInput.BlindedElement)
	if err != nil {
		t.Fatalf("Failed to evaluate blinded input: %v", err)
	}

	// Unblind the result
	unblinded, err := voprf.Unblind(evalResult.EvaluatedElement, blindInput.BlindingFactor)
	if err != nil {
		t.Fatalf("Failed to unblind result: %v", err)
	}

	if unblinded == nil {
		t.Fatal("Unblinded result is nil")
	}

	if len(unblinded) != 32 {
		t.Fatalf("Expected unblinded result length 32, got %d", len(unblinded))
	}
}

func TestGeneratePerPollTag(t *testing.T) {
	voprf, err := NewVOPRF()
	if err != nil {
		t.Fatalf("Failed to create VOPRF: %v", err)
	}

	userID := []byte("user123")
	pollID := []byte("poll456")

	// Generate per-poll tag
	tag, err := voprf.GeneratePerPollTag(userID, pollID)
	if err != nil {
		t.Fatalf("Failed to generate per-poll tag: %v", err)
	}

	if tag == nil {
		t.Fatal("Generated tag is nil")
	}

	if len(tag) != 32 {
		t.Fatalf("Expected tag length 32, got %d", len(tag))
	}

	t.Logf("Generated tag: %s", hex.EncodeToString(tag))
}

func TestUnlinkability(t *testing.T) {
	voprf, err := NewVOPRF()
	if err != nil {
		t.Fatalf("Failed to create VOPRF: %v", err)
	}

	userID := []byte("user123")
	pollID1 := []byte("poll1")
	pollID2 := []byte("poll2")

	// Generate tags for the same user in different polls
	tag1, err := voprf.GeneratePerPollTag(userID, pollID1)
	if err != nil {
		t.Fatalf("Failed to generate tag for poll 1: %v", err)
	}

	tag2, err := voprf.GeneratePerPollTag(userID, pollID2)
	if err != nil {
		t.Fatalf("Failed to generate tag for poll 2: %v", err)
	}

	// The tags should be different (unlinkable)
	if hex.EncodeToString(tag1) == hex.EncodeToString(tag2) {
		t.Fatal("Tags for different polls should be different (unlinkable)")
	}

	t.Logf("Tag for poll 1: %s", hex.EncodeToString(tag1))
	t.Logf("Tag for poll 2: %s", hex.EncodeToString(tag2))
}

func TestDeterministicPerPollTag(t *testing.T) {
	voprf, err := NewVOPRF()
	if err != nil {
		t.Fatalf("Failed to create VOPRF: %v", err)
	}

	userID := []byte("user123")
	pollID := []byte("poll456")

	// Generate the same tag twice
	tag1, err := voprf.GeneratePerPollTag(userID, pollID)
	if err != nil {
		t.Fatalf("Failed to generate first tag: %v", err)
	}

	tag2, err := voprf.GeneratePerPollTag(userID, pollID)
	if err != nil {
		t.Fatalf("Failed to generate second tag: %v", err)
	}

	// The tags should be the same for the same user and poll
	if hex.EncodeToString(tag1) != hex.EncodeToString(tag2) {
		t.Fatal("Tags for the same user and poll should be deterministic")
	}

	t.Logf("Deterministic tag: %s", hex.EncodeToString(tag1))
}

func TestVerifyProof(t *testing.T) {
	voprf, err := NewVOPRF()
	if err != nil {
		t.Fatalf("Failed to create VOPRF: %v", err)
	}

	input := []byte("test input for proof verification")
	
	// Blind the input
	blindInput, err := voprf.Blind(input)
	if err != nil {
		t.Fatalf("Failed to blind input: %v", err)
	}

	// Evaluate the blinded input
	evalResult, err := voprf.Evaluate(blindInput.BlindedElement)
	if err != nil {
		t.Fatalf("Failed to evaluate blinded input: %v", err)
	}

	// Verify the proof
	valid := voprf.VerifyProof(blindInput.BlindedElement, evalResult.EvaluatedElement, evalResult.Proof)
	if !valid {
		t.Fatal("Proof verification failed")
	}

	// Test with invalid proof
	invalidProof := &Proof{
		Challenge: []byte{},
		Response:  []byte{},
	}
	
	valid = voprf.VerifyProof(blindInput.BlindedElement, evalResult.EvaluatedElement, invalidProof)
	if valid {
		t.Fatal("Invalid proof should not be verified")
	}
}
