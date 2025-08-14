package privacy

import (
	"crypto/rand"
	"encoding/binary"
	"fmt"
	"math"
)

// DifferentialPrivacy provides differential privacy mechanisms
type DifferentialPrivacy struct {
	epsilon float64 // Privacy parameter (lower = more private)
	delta   float64 // Privacy parameter (probability of failure)
}

// NewDifferentialPrivacy creates a new differential privacy instance
func NewDifferentialPrivacy(epsilon, delta float64) *DifferentialPrivacy {
	return &DifferentialPrivacy{
		epsilon: epsilon,
		delta:   delta,
	}
}

// LaplaceNoise adds Laplace noise for differential privacy
func (dp *DifferentialPrivacy) LaplaceNoise(sensitivity float64) float64 {
	// Generate random bytes for uniform distribution
	bytes := make([]byte, 8)
	rand.Read(bytes)
	u := float64(binary.BigEndian.Uint64(bytes)) / float64(1<<64)
	
	// Convert uniform to Laplace distribution
	// Laplace distribution: L(0, b) where b = sensitivity / epsilon
	b := sensitivity / dp.epsilon
	
	if u < 0.5 {
		return b * math.Log(2*u)
	} else {
		return -b * math.Log(2*(1-u))
	}
}

// GaussianNoise adds Gaussian noise for differential privacy
func (dp *DifferentialPrivacy) GaussianNoise(sensitivity float64) float64 {
	// Generate two random numbers for Box-Muller transform
	bytes1 := make([]byte, 8)
	bytes2 := make([]byte, 8)
	rand.Read(bytes1)
	rand.Read(bytes2)
	
	u1 := float64(binary.BigEndian.Uint64(bytes1)) / float64(1<<64)
	u2 := float64(binary.BigEndian.Uint64(bytes2)) / float64(1<<64)
	
	// Box-Muller transform to get standard normal distribution
	z0 := math.Sqrt(-2*math.Log(u1)) * math.Cos(2*math.Pi*u2)
	
	// Scale by sensitivity and privacy parameters
	sigma := sensitivity * math.Sqrt(2*math.Log(1.25/dp.delta)) / dp.epsilon
	
	return z0 * sigma
}

// ExponentialMechanism implements the exponential mechanism for differential privacy
func (dp *DifferentialPrivacy) ExponentialMechanism(utilityScores map[string]float64, sensitivity float64) (string, error) {
	if len(utilityScores) == 0 {
		return "", nil
	}
	
	// Calculate exponential weights
	weights := make(map[string]float64)
	maxScore := math.Inf(-1)
	
	for _, score := range utilityScores {
		if score > maxScore {
			maxScore = score
		}
	}
	
	totalWeight := 0.0
	for item, score := range utilityScores {
		// Normalize scores and apply exponential mechanism
		weight := math.Exp(dp.epsilon * (score - maxScore) / (2 * sensitivity))
		weights[item] = weight
		totalWeight += weight
	}
	
	// Sample from the distribution
	bytes := make([]byte, 8)
	rand.Read(bytes)
	u := float64(binary.BigEndian.Uint64(bytes)) / float64(1<<64) * totalWeight
	
	cumulativeWeight := 0.0
	for item, weight := range weights {
		cumulativeWeight += weight
		if u <= cumulativeWeight {
			return item, nil
		}
	}
	
	return "", nil
}

// PrivateHistogram creates a differentially private histogram
func (dp *DifferentialPrivacy) PrivateHistogram(counts map[string]int, sensitivity int) map[string]int {
	privateCounts := make(map[string]int)
	
	for item, count := range counts {
		noise := int(dp.LaplaceNoise(float64(sensitivity)))
		privateCount := count + noise
		
		// Ensure non-negative counts
		if privateCount < 0 {
			privateCount = 0
		}
		
		privateCounts[item] = privateCount
	}
	
	return privateCounts
}

// PrivateMean calculates a differentially private mean
func (dp *DifferentialPrivacy) PrivateMean(values []float64, sensitivity float64) float64 {
	if len(values) == 0 {
		return 0.0
	}
	
	// Calculate true mean
	sum := 0.0
	for _, value := range values {
		sum += value
	}
	trueMean := sum / float64(len(values))
	
	// Add noise
	noise := dp.LaplaceNoise(sensitivity / float64(len(values)))
	
	return trueMean + noise
}

// PrivateSum calculates a differentially private sum
func (dp *DifferentialPrivacy) PrivateSum(values []float64, sensitivity float64) float64 {
	sum := 0.0
	for _, value := range values {
		sum += value
	}
	
	// Add noise
	noise := dp.LaplaceNoise(sensitivity)
	
	return sum + noise
}

// PrivateCount calculates a differentially private count
func (dp *DifferentialPrivacy) PrivateCount(count int, sensitivity int) int {
	noise := int(dp.LaplaceNoise(float64(sensitivity)))
	privateCount := count + noise
	
	// Ensure non-negative count
	if privateCount < 0 {
		privateCount = 0
	}
	
	return privateCount
}

// PrivateThreshold applies differential privacy to threshold queries
func (dp *DifferentialPrivacy) PrivateThreshold(count int, threshold int, sensitivity int) bool {
	privateCount := dp.PrivateCount(count, sensitivity)
	return privateCount >= threshold
}

// PrivateRangeQuery handles range queries with differential privacy
func (dp *DifferentialPrivacy) PrivateRangeQuery(values []float64, min, max float64, sensitivity float64) int {
	count := 0
	for _, value := range values {
		if value >= min && value <= max {
			count++
		}
	}
	
	return dp.PrivateCount(count, int(sensitivity))
}

// PrivatePercentile calculates a differentially private percentile
func (dp *DifferentialPrivacy) PrivatePercentile(values []float64, percentile float64, sensitivity float64) float64 {
	if len(values) == 0 {
		return 0.0
	}
	
	// Sort values
	sorted := make([]float64, len(values))
	copy(sorted, values)
	
	// Calculate true percentile
	index := int(float64(len(sorted)-1) * percentile / 100.0)
	truePercentile := sorted[index]
	
	// Add noise
	noise := dp.LaplaceNoise(sensitivity)
	
	return truePercentile + noise
}

// PrivateVariance calculates a differentially private variance
func (dp *DifferentialPrivacy) PrivateVariance(values []float64, sensitivity float64) float64 {
	if len(values) < 2 {
		return 0.0
	}
	
	// Calculate true variance
	mean := 0.0
	for _, value := range values {
		mean += value
	}
	mean /= float64(len(values))
	
	variance := 0.0
	for _, value := range values {
		variance += math.Pow(value-mean, 2)
	}
	variance /= float64(len(values)-1)
	
	// Add noise
	noise := dp.LaplaceNoise(sensitivity)
	
	return variance + noise
}

// PrivateCorrelation calculates a differentially private correlation coefficient
func (dp *DifferentialPrivacy) PrivateCorrelation(x, y []float64, sensitivity float64) float64 {
	if len(x) != len(y) || len(x) < 2 {
		return 0.0
	}
	
	// Calculate true correlation
	meanX := 0.0
	meanY := 0.0
	for i := range x {
		meanX += x[i]
		meanY += y[i]
	}
	meanX /= float64(len(x))
	meanY /= float64(len(y))
	
	numerator := 0.0
	denomX := 0.0
	denomY := 0.0
	
	for i := range x {
		dx := x[i] - meanX
		dy := y[i] - meanY
		numerator += dx * dy
		denomX += dx * dx
		denomY += dy * dy
	}
	
	denominator := math.Sqrt(denomX * denomY)
	if denominator == 0 {
		return 0.0
	}
	
	trueCorrelation := numerator / denominator
	
	// Add noise
	noise := dp.LaplaceNoise(sensitivity)
	
	return trueCorrelation + noise
}

// PrivateMedian calculates a differentially private median
func (dp *DifferentialPrivacy) PrivateMedian(values []float64, sensitivity float64) float64 {
	return dp.PrivatePercentile(values, 50.0, sensitivity)
}

// PrivateMode calculates a differentially private mode
func (dp *DifferentialPrivacy) PrivateMode(values []string, sensitivity int) (string, error) {
	// Count occurrences
	counts := make(map[string]int)
	for _, value := range values {
		counts[value]++
	}
	
	// Convert to float64 for exponential mechanism
	utilityScores := make(map[string]float64)
	for item, count := range counts {
		utilityScores[item] = float64(count)
	}
	
	// Use exponential mechanism to select the mode
	return dp.ExponentialMechanism(utilityScores, float64(sensitivity))
}

// ComposePrivacyBudgets composes multiple differential privacy operations
func (dp *DifferentialPrivacy) ComposePrivacyBudgets(epsilons []float64, deltas []float64) (float64, float64) {
	// Basic composition
	totalEpsilon := 0.0
	totalDelta := 0.0
	
	for _, epsilon := range epsilons {
		totalEpsilon += epsilon
	}
	
	for _, delta := range deltas {
		totalDelta += delta
	}
	
	return totalEpsilon, totalDelta
}

// AdvancedComposition provides advanced composition for multiple queries
func (dp *DifferentialPrivacy) AdvancedComposition(k int, epsilon, delta float64) (float64, float64) {
	// Advanced composition theorem
	composedEpsilon := epsilon * math.Sqrt(2*float64(k)*math.Log(1/dp.delta))
	composedDelta := float64(k) * delta
	
	return composedEpsilon, composedDelta
}

// GetPrivacyParameters returns the current privacy parameters
func (dp *DifferentialPrivacy) GetPrivacyParameters() (float64, float64) {
	return dp.epsilon, dp.delta
}

// SetPrivacyParameters updates the privacy parameters
func (dp *DifferentialPrivacy) SetPrivacyParameters(epsilon, delta float64) {
	dp.epsilon = epsilon
	dp.delta = delta
}

// ValidatePrivacyParameters validates the privacy parameters
func (dp *DifferentialPrivacy) ValidatePrivacyParameters() error {
	if dp.epsilon <= 0 {
		return fmt.Errorf("epsilon must be positive")
	}
	if dp.delta <= 0 || dp.delta >= 1 {
		return fmt.Errorf("delta must be between 0 and 1")
	}
	return nil
}
