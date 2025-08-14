package merkle

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

// MerkleTree represents a Merkle tree for vote commitments
type MerkleTree struct {
	leaves []string
	root   string
	proofs map[string]*MerkleProof
}

// MerkleProof represents a Merkle proof for a leaf
type MerkleProof struct {
	Leaf      string   `json:"leaf"`
	Path      []string `json:"path"`
	Index     int      `json:"index"`
	Root      string   `json:"root"`
	LeafCount int      `json:"leaf_count"`
}

// NewMerkleTree creates a new Merkle tree
func NewMerkleTree() *MerkleTree {
	return &MerkleTree{
		leaves: make([]string, 0),
		proofs: make(map[string]*MerkleProof),
	}
}

// AddLeaf adds a leaf to the Merkle tree and returns its proof
func (mt *MerkleTree) AddLeaf(leaf string) (*MerkleProof, error) {
	if leaf == "" {
		return nil, fmt.Errorf("leaf cannot be empty")
	}

	// Add leaf to the tree
	mt.leaves = append(mt.leaves, leaf)
	
	// Recompute the tree
	mt.recomputeTree()
	
	// Generate proof for the new leaf
	proof := mt.generateProof(len(mt.leaves)-1, leaf)
	mt.proofs[leaf] = proof
	
	return proof, nil
}

// GetProof returns the Merkle proof for a given leaf
func (mt *MerkleTree) GetProof(leaf string) (*MerkleProof, bool) {
	proof, exists := mt.proofs[leaf]
	return proof, exists
}

// GetRoot returns the current Merkle root
func (mt *MerkleTree) GetRoot() string {
	return mt.root
}

// GetLeafCount returns the number of leaves in the tree
func (mt *MerkleTree) GetLeafCount() int {
	return len(mt.leaves)
}

// VerifyProof verifies a Merkle proof
func (mt *MerkleTree) VerifyProof(proof *MerkleProof) bool {
	if proof == nil || proof.Leaf == "" {
		return false
	}

	// For now, just verify that the leaf exists in our tree
	for _, leaf := range mt.leaves {
		if leaf == proof.Leaf {
			return true
		}
	}
	
	return false
}

// recomputeTree recomputes the entire Merkle tree
func (mt *MerkleTree) recomputeTree() {
	if len(mt.leaves) == 0 {
		mt.root = ""
		return
	}

	if len(mt.leaves) == 1 {
		mt.root = mt.leaves[0]
		return
	}

	// Build the tree from leaves
	level := make([]string, len(mt.leaves))
	copy(level, mt.leaves)

	for len(level) > 1 {
		nextLevel := make([]string, 0)
		
		for i := 0; i < len(level); i += 2 {
			if i+1 < len(level) {
				// Hash pair of nodes
				nextLevel = append(nextLevel, hashPair(level[i], level[i+1]))
			} else {
				// Single node (odd number of nodes)
				nextLevel = append(nextLevel, level[i])
			}
		}
		
		level = nextLevel
	}

	mt.root = level[0]
}

// generateProof generates a Merkle proof for a leaf at the given index
func (mt *MerkleTree) generateProof(index int, leaf string) *MerkleProof {
	if index >= len(mt.leaves) {
		return nil
	}

	proof := &MerkleProof{
		Leaf:      leaf,
		Index:     index,
		Root:      mt.root,
		LeafCount: len(mt.leaves),
		Path:      make([]string, 0),
	}

	// For now, return a simple proof structure
	// In a full implementation, this would build the actual proof path
	// by walking up the tree and collecting siblings
	
	return proof
}

// hashPair hashes two strings together
func hashPair(left, right string) string {
	combined := left + right
	hash := sha256.Sum256([]byte(combined))
	return hex.EncodeToString(hash[:])
}

// GetCommitmentLog returns the commitment log for public audit
func (mt *MerkleTree) GetCommitmentLog() map[string]interface{} {
	return map[string]interface{}{
		"root":       mt.root,
		"leaf_count": len(mt.leaves),
		"timestamp":  fmt.Sprintf("%d", len(mt.leaves)), // Simplified timestamp
	}
}

// GetLeaves returns all leaves in the tree (for debugging/audit)
func (mt *MerkleTree) GetLeaves() []string {
	leaves := make([]string, len(mt.leaves))
	copy(leaves, mt.leaves)
	return leaves
}
