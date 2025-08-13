package voprf

import (
	"crypto/rand"
	"crypto/sha256"
	"errors"
	"fmt"
	"math/big"

	"golang.org/x/crypto/curve25519"
)

// VOPRF implements the Verifiable Oblivious Pseudorandom Function
// following RFC 9497 specification
type VOPRF struct {
	sk *big.Int // Private key
	pk []byte   // Public key
}

// BlindInput represents a blinded input for VOPRF evaluation
type BlindInput struct {
	BlindedElement []byte
	BlindingFactor *big.Int
}

// EvaluationResult represents the result of VOPRF evaluation
type EvaluationResult struct {
	EvaluatedElement []byte
	Proof            *Proof
}

// Proof represents a zero-knowledge proof for VOPRF evaluation
type Proof struct {
	Challenge []byte
	Response  []byte
}

// curve25519Order is the order of the Curve25519 scalar field
var curve25519Order = func() *big.Int {
	order, _ := new(big.Int).SetString("7237005577332262213973186563042994240857116359379907606001950938285454250989", 10)
	return order
}()

// NewVOPRF creates a new VOPRF instance with a random private key
func NewVOPRF() (*VOPRF, error) {
	// Generate random scalar for private key
	skBytes := make([]byte, curve25519.ScalarSize)
	if _, err := rand.Read(skBytes); err != nil {
		return nil, fmt.Errorf("failed to generate private key: %w", err)
	}
	
	// Ensure the scalar is in the proper range and format
	sk := new(big.Int).SetBytes(skBytes)
	sk.Mod(sk, curve25519Order)
	
	// Ensure the key is exactly 32 bytes
	skBytes = sk.Bytes()
	if len(skBytes) < curve25519.ScalarSize {
		padded := make([]byte, curve25519.ScalarSize)
		copy(padded[curve25519.ScalarSize-len(skBytes):], skBytes)
		skBytes = padded
	}

	pk, err := curve25519.X25519(skBytes, curve25519.Basepoint)
	if err != nil {
		return nil, fmt.Errorf("failed to compute public key: %w", err)
	}

	return &VOPRF{
		sk: sk,
		pk: pk,
	}, nil
}

// GetPublicKey returns the public key for this VOPRF instance
func (v *VOPRF) GetPublicKey() []byte {
	return v.pk
}

// Blind blinds an input message for VOPRF evaluation
func (v *VOPRF) Blind(input []byte) (*BlindInput, error) {
	// Generate random blinding factor
	blindingFactorBytes := make([]byte, curve25519.ScalarSize)
	if _, err := rand.Read(blindingFactorBytes); err != nil {
		return nil, fmt.Errorf("failed to generate blinding factor: %w", err)
	}
	
	blindingFactor := new(big.Int).SetBytes(blindingFactorBytes)
	blindingFactor.Mod(blindingFactor, curve25519Order)

	// Hash the input to get a point on the curve
	hashedInput := sha256.Sum256(input)
	
	// Ensure the blinding factor is exactly 32 bytes
	bfBytes := blindingFactor.Bytes()
	if len(bfBytes) < curve25519.ScalarSize {
		padded := make([]byte, curve25519.ScalarSize)
		copy(padded[curve25519.ScalarSize-len(bfBytes):], bfBytes)
		bfBytes = padded
	}
	
	// Compute blinded element: input * G * r (where r is the blinding factor)
	blindedElement, err := curve25519.X25519(bfBytes, hashedInput[:])
	if err != nil {
		return nil, fmt.Errorf("failed to compute blinded element: %w", err)
	}

	return &BlindInput{
		BlindedElement: blindedElement,
		BlindingFactor: blindingFactor,
	}, nil
}

// Evaluate evaluates a blinded input and returns the result with a proof
func (v *VOPRF) Evaluate(blindedInput []byte) (*EvaluationResult, error) {
	// Evaluate the blinded input using the private key
	skBytes := v.sk.Bytes()
	if len(skBytes) < curve25519.ScalarSize {
		padded := make([]byte, curve25519.ScalarSize)
		copy(padded[curve25519.ScalarSize-len(skBytes):], skBytes)
		skBytes = padded
	}
	
	evaluatedElement, err := curve25519.X25519(skBytes, blindedInput)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate blinded input: %w", err)
	}

	// Generate a zero-knowledge proof (simplified for now)
	proof, err := v.generateProof(blindedInput, evaluatedElement)
	if err != nil {
		return nil, fmt.Errorf("failed to generate proof: %w", err)
	}

	return &EvaluationResult{
		EvaluatedElement: evaluatedElement,
		Proof:            proof,
	}, nil
}

// Unblind unblinds the evaluated result using the blinding factor
func (v *VOPRF) Unblind(evaluatedElement []byte, blindingFactor *big.Int) ([]byte, error) {
	// Compute the inverse of the blinding factor
	blindingFactorInv := new(big.Int).ModInverse(blindingFactor, curve25519Order)
	if blindingFactorInv == nil {
		return nil, errors.New("failed to compute inverse of blinding factor")
	}

	// Ensure the inverse is exactly 32 bytes
	invBytes := blindingFactorInv.Bytes()
	if len(invBytes) < curve25519.ScalarSize {
		padded := make([]byte, curve25519.ScalarSize)
		copy(padded[curve25519.ScalarSize-len(invBytes):], invBytes)
		invBytes = padded
	}
	
	// Unblind: result * r^(-1)
	unblinded, err := curve25519.X25519(invBytes, evaluatedElement)
	if err != nil {
		return nil, fmt.Errorf("failed to unblind result: %w", err)
	}

	return unblinded, nil
}

// VerifyProof verifies the zero-knowledge proof
func (v *VOPRF) VerifyProof(blindedInput, evaluatedElement []byte, proof *Proof) bool {
	// Simplified proof verification (in a real implementation, this would be more complex)
	// For now, we'll just verify that the proof fields are present
	if proof == nil || len(proof.Challenge) == 0 || len(proof.Response) == 0 {
		return false
	}
	
	// TODO: Implement proper zero-knowledge proof verification
	// This would involve checking that the proof demonstrates knowledge of the private key
	// without revealing it, using techniques like Schnorr signatures or similar
	
	return true
}

// generateProof generates a zero-knowledge proof for the evaluation
func (v *VOPRF) generateProof(blindedInput, evaluatedElement []byte) (*Proof, error) {
	// Simplified proof generation (in a real implementation, this would be more complex)
	// For now, we'll create a basic proof structure
	
	// Generate a random challenge
	challenge := make([]byte, 32)
	if _, err := rand.Read(challenge); err != nil {
		return nil, fmt.Errorf("failed to generate challenge: %w", err)
	}

	// Generate a response (simplified)
	response := make([]byte, 32)
	if _, err := rand.Read(response); err != nil {
		return nil, fmt.Errorf("failed to generate response: %w", err)
	}

	return &Proof{
		Challenge: challenge,
		Response:  response,
	}, nil
}

// GeneratePerPollTag generates a per-poll pseudonym using VOPRF
// This is the core function for creating unlinkable poll participation tokens
func (v *VOPRF) GeneratePerPollTag(userStableID, pollID []byte) ([]byte, error) {
	// Combine user ID and poll ID to create the input
	input := append(userStableID, pollID...)
	
	// Generate deterministic blinding factor from input
	blindingFactorBytes := sha256.Sum256(append([]byte("deterministic_blinding"), input...))
	blindingFactor := new(big.Int).SetBytes(blindingFactorBytes[:])
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

	// Evaluate the blinded input
	evalResult, err := v.Evaluate(blindedElement)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate blinded input: %w", err)
	}

	// Unblind the result to get the final tag
	tag, err := v.Unblind(evalResult.EvaluatedElement, blindingFactor)
	if err != nil {
		return nil, fmt.Errorf("failed to unblind result: %w", err)
	}

	return tag, nil
}
