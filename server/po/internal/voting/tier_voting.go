package voting

import (
	"fmt"
	"log"
)

// VerificationTier represents the different verification levels
type VerificationTier string

const (
	TierT0 VerificationTier = "T0" // Human presence - basic verification
	TierT1 VerificationTier = "T1" // WebAuthn - device-based verification
	TierT2 VerificationTier = "T2" // Personhood - identity verification
	TierT3 VerificationTier = "T3" // Citizenship - government-verified identity
)

// TierWeight defines the voting weight for each verification tier
type TierWeight struct {
	Tier  VerificationTier `json:"tier"`
	Weight float64         `json:"weight"`
	Description string     `json:"description"`
}

// TierVotingSystem handles tier-based voting with weighted votes
type TierVotingSystem struct {
	tierWeights map[VerificationTier]TierWeight
}

// NewTierVotingSystem creates a new tier-based voting system
func NewTierVotingSystem() *TierVotingSystem {
	weights := map[VerificationTier]TierWeight{
		TierT0: {
			Tier:         TierT0,
			Weight:       1.0,
			Description:  "Human presence verification - basic weight",
		},
		TierT1: {
			Tier:         TierT1,
			Weight:       2.0,
			Description:  "WebAuthn device verification - enhanced weight",
		},
		TierT2: {
			Tier:         TierT2,
			Weight:       5.0,
			Description:  "Personhood verification - significant weight",
		},
		TierT3: {
			Tier:         TierT3,
			Weight:       10.0,
			Description:  "Citizenship verification - maximum weight",
		},
	}

	return &TierVotingSystem{
		tierWeights: weights,
	}
}

// GetTierWeight returns the weight for a given verification tier
func (tvs *TierVotingSystem) GetTierWeight(tier VerificationTier) (TierWeight, error) {
	weight, exists := tvs.tierWeights[tier]
	if !exists {
		return TierWeight{}, fmt.Errorf("unknown verification tier: %s", tier)
	}
	return weight, nil
}

// CalculateWeightedVote calculates the weighted vote value for a given tier and choice
func (tvs *TierVotingSystem) CalculateWeightedVote(tier VerificationTier, choice int) (float64, error) {
	weight, err := tvs.GetTierWeight(tier)
	if err != nil {
		return 0, err
	}

	// For now, we'll use a simple weighted calculation
	// In a more sophisticated system, you might have different weighting schemes
	weightedVote := weight.Weight * float64(choice)
	
	log.Printf("Calculated weighted vote: tier=%s, choice=%d, weight=%.2f, result=%.2f", 
		tier, choice, weight.Weight, weightedVote)
	
	return weightedVote, nil
}

// AggregateWeightedVotes aggregates votes with their respective weights
func (tvs *TierVotingSystem) AggregateWeightedVotes(votes []WeightedVote) map[int]float64 {
	aggregated := make(map[int]float64)
	totalWeight := 0.0

	// Sum up weighted votes for each choice
	for _, vote := range votes {
		weight, err := tvs.GetTierWeight(vote.Tier)
		if err != nil {
			log.Printf("Warning: Unknown tier %s, skipping vote", vote.Tier)
			continue
		}

		weightedValue := weight.Weight * float64(vote.Choice)
		aggregated[vote.Choice] += weightedValue
		totalWeight += weight.Weight
	}

	// Normalize by total weight if needed
	if totalWeight > 0 {
		for choice := range aggregated {
			aggregated[choice] = aggregated[choice] / totalWeight
		}
	}

	return aggregated
}

// WeightedVote represents a vote with its verification tier
type WeightedVote struct {
	UserID    string          `json:"user_id"`
	Tier      VerificationTier `json:"tier"`
	Choice    int             `json:"choice"`
	Timestamp int64           `json:"timestamp"`
}

// GetTierBreakdown returns a breakdown of votes by verification tier
func (tvs *TierVotingSystem) GetTierBreakdown(votes []WeightedVote) map[VerificationTier]TierBreakdown {
	breakdown := make(map[VerificationTier]TierBreakdown)

	// Initialize breakdown for all tiers
	for tier := range tvs.tierWeights {
		breakdown[tier] = TierBreakdown{
			Tier:        tier,
			VoteCount:   0,
			TotalWeight: 0,
			Choices:     make(map[int]int),
		}
	}

	// Count votes by tier
	for _, vote := range votes {
		bd := breakdown[vote.Tier]
		bd.VoteCount++
		bd.Choices[vote.Choice]++
		
		weight, err := tvs.GetTierWeight(vote.Tier)
		if err == nil {
			bd.TotalWeight += weight.Weight
		}
		
		breakdown[vote.Tier] = bd
	}

	return breakdown
}

// TierBreakdown represents the breakdown of votes for a specific tier
type TierBreakdown struct {
	Tier        VerificationTier `json:"tier"`
	VoteCount   int              `json:"vote_count"`
	TotalWeight float64          `json:"total_weight"`
	Choices     map[int]int      `json:"choices"`
	Description string           `json:"description"`
}

// ValidateTierAccess checks if a user with a given tier can vote on a specific poll
func (tvs *TierVotingSystem) ValidateTierAccess(tier VerificationTier, pollRequirements map[string]interface{}) (bool, error) {
	// Check if the poll has tier requirements
	minTier, hasMinTier := pollRequirements["minimum_tier"]
	if !hasMinTier {
		// No tier requirements, all tiers can vote
		return true, nil
	}

	// Convert minimum tier requirement to VerificationTier
	minTierStr, ok := minTier.(string)
	if !ok {
		return false, fmt.Errorf("invalid minimum tier requirement format")
	}

	minTierEnum := VerificationTier(minTierStr)
	
	// Define tier hierarchy (higher tiers have more privileges)
	tierHierarchy := map[VerificationTier]int{
		TierT0: 0,
		TierT1: 1,
		TierT2: 2,
		TierT3: 3,
	}

	userTierLevel, userExists := tierHierarchy[tier]
	minTierLevel, minExists := tierHierarchy[minTierEnum]

	if !userExists || !minExists {
		return false, fmt.Errorf("invalid tier comparison: user=%s, required=%s", tier, minTierEnum)
	}

	// User can vote if their tier level is >= minimum required level
	canVote := userTierLevel >= minTierLevel
	
	log.Printf("Tier access validation: user_tier=%s (level=%d), required_tier=%s (level=%d), can_vote=%t", 
		tier, userTierLevel, minTierEnum, minTierLevel, canVote)
	
	return canVote, nil
}

// GetTierStatistics returns statistics about tier distribution
func (tvs *TierVotingSystem) GetTierStatistics(votes []WeightedVote) TierStatistics {
	stats := TierStatistics{
		TotalVotes:     len(votes),
		TierCounts:     make(map[VerificationTier]int),
		TierWeights:    make(map[VerificationTier]float64),
		AverageWeight:  0,
		WeightedTotal:  0,
	}

	// Count votes and weights by tier
	for _, vote := range votes {
		stats.TierCounts[vote.Tier]++
		
		weight, err := tvs.GetTierWeight(vote.Tier)
		if err == nil {
			stats.TierWeights[vote.Tier] += weight.Weight
			stats.WeightedTotal += weight.Weight
		}
	}

	// Calculate average weight
	if stats.TotalVotes > 0 {
		stats.AverageWeight = stats.WeightedTotal / float64(stats.TotalVotes)
	}

	return stats
}

// TierStatistics represents statistics about tier distribution
type TierStatistics struct {
	TotalVotes    int                        `json:"total_votes"`
	TierCounts    map[VerificationTier]int   `json:"tier_counts"`
	TierWeights   map[VerificationTier]float64 `json:"tier_weights"`
	AverageWeight float64                    `json:"average_weight"`
	WeightedTotal float64                    `json:"weighted_total"`
}

// UpdateTierWeight updates the weight for a specific tier
func (tvs *TierVotingSystem) UpdateTierWeight(tier VerificationTier, newWeight float64, description string) error {
	if newWeight < 0 {
		return fmt.Errorf("tier weight cannot be negative")
	}

	tvs.tierWeights[tier] = TierWeight{
		Tier:        tier,
		Weight:      newWeight,
		Description: description,
	}

	log.Printf("Updated tier weight: %s = %.2f (%s)", tier, newWeight, description)
	return nil
}

// GetTierWeights returns all tier weights
func (tvs *TierVotingSystem) GetTierWeights() map[VerificationTier]TierWeight {
	// Return a copy to avoid external modification
	weights := make(map[VerificationTier]TierWeight)
	for tier, weight := range tvs.tierWeights {
		weights[tier] = weight
	}
	return weights
}
