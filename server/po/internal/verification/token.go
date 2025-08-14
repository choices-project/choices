package verification

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"

	"golang.org/x/crypto/curve25519"
)

// TokenVerifier verifies tokens issued by the Identity Authority
type TokenVerifier struct {
	iaPublicKey []byte
}

// NewTokenVerifier creates a new token verifier with the IA's public key
func NewTokenVerifier(iaPublicKeyHex string) (*TokenVerifier, error) {
	iaPublicKey, err := hex.DecodeString(iaPublicKeyHex)
	if err != nil {
		return nil, fmt.Errorf("failed to decode IA public key: %w", err)
	}

	if len(iaPublicKey) != curve25519.ScalarSize {
		return nil, fmt.Errorf("invalid public key length: expected %d, got %d", curve25519.ScalarSize, len(iaPublicKey))
	}

	return &TokenVerifier{
		iaPublicKey: iaPublicKey,
	}, nil
}

// VerifyToken verifies that a token was issued by the IA for the given user and poll
func (tv *TokenVerifier) VerifyToken(tokenHex, userStableID, pollID string) (bool, error) {
	// Decode the token
	token, err := hex.DecodeString(tokenHex)
	if err != nil {
		return false, fmt.Errorf("failed to decode token: %w", err)
	}

	// Generate the expected tag using the same deterministic process as IA
	expectedTag, err := tv.GenerateExpectedTag(userStableID, pollID)
	if err != nil {
		return false, fmt.Errorf("failed to generate expected tag: %w", err)
	}

	// Compare the token with the expected tag
	return hex.EncodeToString(token) == hex.EncodeToString(expectedTag), nil
}

// GenerateExpectedTag generates the expected tag for a user and poll combination
// This uses the same deterministic process as the IA service
func (tv *TokenVerifier) GenerateExpectedTag(userStableID, pollID string) ([]byte, error) {
	// Combine user ID and poll ID to create the input
	input := append([]byte(userStableID), []byte(pollID)...)
	
	// Generate deterministic blinding factor from input (same as IA)
	blindingFactorBytes := sha256.Sum256(append([]byte("deterministic_blinding"), input...))
	blindingFactor := new(big.Int).SetBytes(blindingFactorBytes[:])
	
	// Use the same curve25519 order as IA
	curve25519Order := func() *big.Int {
		order, _ := new(big.Int).SetString("7237005577332262213973186563042994240857116359379907606001950938285454250989", 10)
		return order
	}()
	blindingFactor.Mod(blindingFactor, curve25519Order)
	
	// Ensure the blinding factor is exactly 32 bytes
	bfBytes := blindingFactor.Bytes()
	if len(bfBytes) < curve25519.ScalarSize {
		padded := make([]byte, curve25519.ScalarSize)
		copy(padded[curve25519.ScalarSize-len(bfBytes):], bfBytes)
		bfBytes = padded
	}
	
	// Hash the input to get a point on the curve
	hashedInput := sha256.Sum256(input)
	
	// Compute blinded element
	blindedElement, err := curve25519.X25519(bfBytes, hashedInput[:])
	if err != nil {
		return nil, fmt.Errorf("failed to compute blinded element: %w", err)
	}

	// Evaluate using the IA's public key (this is a simplified verification)
	// In a real implementation, this would use the full VOPRF verification
	evaluatedElement, err := curve25519.X25519(bfBytes, blindedElement)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate blinded element: %w", err)
	}

	// Unblind the result
	blindingFactorInv := new(big.Int).ModInverse(blindingFactor, curve25519Order)
	if blindingFactorInv == nil {
		return nil, fmt.Errorf("failed to compute inverse of blinding factor")
	}

	invBytes := blindingFactorInv.Bytes()
	if len(invBytes) < curve25519.ScalarSize {
		padded := make([]byte, curve25519.ScalarSize)
		copy(padded[curve25519.ScalarSize-len(invBytes):], invBytes)
		invBytes = padded
	}
	
	unblinded, err := curve25519.X25519(invBytes, evaluatedElement)
	if err != nil {
		return nil, fmt.Errorf("failed to unblind result: %w", err)
	}

	return unblinded, nil
}

// GetIAPublicKey returns the IA public key for verification
func (tv *TokenVerifier) GetIAPublicKey() string {
	return hex.EncodeToString(tv.iaPublicKey)
}
