package merkle

import (
	"fmt"
	"testing"
)

func TestNewMerkleTree(t *testing.T) {
	mt := NewMerkleTree()
	
	if mt == nil {
		t.Fatal("NewMerkleTree returned nil")
	}
	
	if len(mt.leaves) != 0 {
		t.Errorf("Expected empty leaves, got %d", len(mt.leaves))
	}
	
	if mt.root != "" {
		t.Errorf("Expected empty root, got %s", mt.root)
	}
}

func TestAddLeaf(t *testing.T) {
	mt := NewMerkleTree()
	
	// Add first leaf
	leaf1 := "leaf1"
	proof1, err := mt.AddLeaf(leaf1)
	if err != nil {
		t.Fatalf("Failed to add leaf: %v", err)
	}
	
	if proof1 == nil {
		t.Fatal("Expected proof, got nil")
	}
	
	if proof1.Leaf != leaf1 {
		t.Errorf("Expected leaf %s, got %s", leaf1, proof1.Leaf)
	}
	
	if proof1.Index != 0 {
		t.Errorf("Expected index 0, got %d", proof1.Index)
	}
	
	if mt.GetRoot() != leaf1 {
		t.Errorf("Expected root %s, got %s", leaf1, mt.GetRoot())
	}
	
	// Add second leaf
	leaf2 := "leaf2"
	proof2, err := mt.AddLeaf(leaf2)
	if err != nil {
		t.Fatalf("Failed to add second leaf: %v", err)
	}
	
	if proof2.Index != 1 {
		t.Errorf("Expected index 1, got %d", proof2.Index)
	}
	
	// Root should be hash of both leaves
	expectedRoot := hashPair(leaf1, leaf2)
	if mt.GetRoot() != expectedRoot {
		t.Errorf("Expected root %s, got %s", expectedRoot, mt.GetRoot())
	}
}

func TestVerifyProof(t *testing.T) {
	mt := NewMerkleTree()
	
	// Add multiple leaves
	leaves := []string{"leaf1", "leaf2", "leaf3", "leaf4"}
	for _, leaf := range leaves {
		_, err := mt.AddLeaf(leaf)
		if err != nil {
			t.Fatalf("Failed to add leaf %s: %v", leaf, err)
		}
	}
	
	// Verify each proof
	for i, leaf := range leaves {
		proof, exists := mt.GetProof(leaf)
		if !exists {
			t.Fatalf("Proof not found for leaf %s", leaf)
		}
		
		if !mt.VerifyProof(proof) {
			t.Errorf("Proof verification failed for leaf %s at index %d", leaf, i)
		}
	}
}

func TestVerifyProofInvalid(t *testing.T) {
	mt := NewMerkleTree()
	
	// Add a leaf
	leaf := "test_leaf"
	_, err := mt.AddLeaf(leaf)
	if err != nil {
		t.Fatalf("Failed to add leaf: %v", err)
	}
	
	// Test with nil proof
	if mt.VerifyProof(nil) {
		t.Error("Expected false for nil proof")
	}
	
	// Test with empty leaf
	invalidProof := &MerkleProof{
		Leaf: "",
		Path: []string{"sibling"},
		Root: mt.GetRoot(),
	}
	if mt.VerifyProof(invalidProof) {
		t.Error("Expected false for empty leaf")
	}
	
	// Test with non-existent leaf
	invalidProof2 := &MerkleProof{
		Leaf: "non_existent_leaf",
		Path: []string{},
		Root: mt.GetRoot(),
	}
	if mt.VerifyProof(invalidProof2) {
		t.Error("Expected false for non-existent leaf")
	}
}

func TestGetCommitmentLog(t *testing.T) {
	mt := NewMerkleTree()
	
	// Add some leaves
	leaves := []string{"leaf1", "leaf2", "leaf3"}
	for _, leaf := range leaves {
		_, err := mt.AddLeaf(leaf)
		if err != nil {
			t.Fatalf("Failed to add leaf %s: %v", leaf, err)
		}
	}
	
	// Get commitment log
	log := mt.GetCommitmentLog()
	
	if log["root"] != mt.GetRoot() {
		t.Errorf("Expected root %s, got %s", mt.GetRoot(), log["root"])
	}
	
	if log["leaf_count"] != len(leaves) {
		t.Errorf("Expected leaf count %d, got %d", len(leaves), log["leaf_count"])
	}
}

func TestMerkleTreeWithManyLeaves(t *testing.T) {
	mt := NewMerkleTree()
	
	// Add many leaves
	numLeaves := 100
	for i := 0; i < numLeaves; i++ {
		leaf := fmt.Sprintf("leaf_%d", i)
		_, err := mt.AddLeaf(leaf)
		if err != nil {
			t.Fatalf("Failed to add leaf %s: %v", leaf, err)
		}
	}
	
	// Verify all proofs
	for i := 0; i < numLeaves; i++ {
		leaf := fmt.Sprintf("leaf_%d", i)
		proof, exists := mt.GetProof(leaf)
		if !exists {
			t.Fatalf("Proof not found for leaf %s", leaf)
		}
		
		if !mt.VerifyProof(proof) {
			t.Errorf("Proof verification failed for leaf %s", leaf)
		}
	}
	
	if mt.GetLeafCount() != numLeaves {
		t.Errorf("Expected %d leaves, got %d", numLeaves, mt.GetLeafCount())
	}
}

func TestHashPair(t *testing.T) {
	// Test that hashPair is deterministic
	left := "left"
	right := "right"
	
	hash1 := hashPair(left, right)
	hash2 := hashPair(left, right)
	
	if hash1 != hash2 {
		t.Errorf("hashPair is not deterministic: %s != %s", hash1, hash2)
	}
	
	// Test that order matters
	hash3 := hashPair(right, left)
	if hash1 == hash3 {
		t.Error("hashPair should be order-dependent")
	}
}
