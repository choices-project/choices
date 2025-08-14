package analytics

import (
	"crypto/rand"
	"encoding/json"
	"math"
)

// DemographicCategory represents different demographic categories
type DemographicCategory string

const (
	CategoryAge      DemographicCategory = "age"
	CategoryGender   DemographicCategory = "gender"
	CategoryLocation DemographicCategory = "location"
	CategoryEducation DemographicCategory = "education"
	CategoryIncome   DemographicCategory = "income"
	CategoryTier     DemographicCategory = "verification_tier"
)

// DemographicData represents demographic information for a voter
type DemographicData struct {
	UserID     string                    `json:"user_id"`
	Age        int                       `json:"age"`
	Gender     string                    `json:"gender"`
	Location   string                    `json:"location"`
	Education  string                    `json:"education"`
	Income     string                    `json:"income"`
	VerificationTier string              `json:"verification_tier"`
	Categories map[DemographicCategory]string `json:"categories"`
}

// DemographicBreakdown represents aggregated demographic statistics
type DemographicBreakdown struct {
	Category    DemographicCategory           `json:"category"`
	TotalVotes  int                          `json:"total_votes"`
	Breakdown   map[string]DemographicGroup  `json:"breakdown"`
	Privacy     PrivacyMetrics               `json:"privacy"`
}

// DemographicGroup represents statistics for a specific demographic group
type DemographicGroup struct {
	GroupName     string             `json:"group_name"`
	VoteCount     int                `json:"vote_count"`
	ChoiceBreakdown map[int]int      `json:"choice_breakdown"`
	WeightedTotal  float64           `json:"weighted_total"`
	Percentage     float64           `json:"percentage"`
	Confidence     float64           `json:"confidence"`
}

// PrivacyMetrics represents privacy protection metrics
type PrivacyMetrics struct {
	MinGroupSize    int     `json:"min_group_size"`
	NoiseLevel      float64 `json:"noise_level"`
	SuppressedGroups int    `json:"suppressed_groups"`
	ConfidenceLevel float64 `json:"confidence_level"`
}

// DemographicAnalyzer handles demographic analysis with privacy protection
type DemographicAnalyzer struct {
	minGroupSize    int
	noiseLevel      float64
	confidenceLevel float64
}

// NewDemographicAnalyzer creates a new demographic analyzer
func NewDemographicAnalyzer(minGroupSize int, noiseLevel, confidenceLevel float64) *DemographicAnalyzer {
	return &DemographicAnalyzer{
		minGroupSize:    minGroupSize,
		noiseLevel:      noiseLevel,
		confidenceLevel: confidenceLevel,
	}
}

// AnalyzeDemographics performs demographic analysis on voting data
func (da *DemographicAnalyzer) AnalyzeDemographics(votes []VoteWithDemographics, category DemographicCategory) (*DemographicBreakdown, error) {
	breakdown := &DemographicBreakdown{
		Category:   category,
		TotalVotes: len(votes),
		Breakdown:  make(map[string]DemographicGroup),
		Privacy: PrivacyMetrics{
			MinGroupSize:    da.minGroupSize,
			NoiseLevel:      da.noiseLevel,
			ConfidenceLevel: da.confidenceLevel,
		},
	}

	// Group votes by demographic category
	groups := make(map[string][]VoteWithDemographics)
	for _, vote := range votes {
		groupValue := da.getDemographicValue(vote.Demographics, category)
		groups[groupValue] = append(groups[groupValue], vote)
	}

	// Calculate statistics for each group
	for groupName, groupVotes := range groups {
		// Apply privacy protection
		if len(groupVotes) < da.minGroupSize {
			breakdown.Privacy.SuppressedGroups++
			continue // Suppress small groups for privacy
		}

		group := da.calculateGroupStatistics(groupName, groupVotes)
		
		// Add noise for privacy protection
		group = da.addNoise(group)
		
		breakdown.Breakdown[groupName] = group
	}

	// Calculate percentages
	da.calculatePercentages(breakdown)

	return breakdown, nil
}

// VoteWithDemographics represents a vote with associated demographic data
type VoteWithDemographics struct {
	Vote         Vote             `json:"vote"`
	Demographics DemographicData  `json:"demographics"`
}

// Vote represents a basic vote
type Vote struct {
	UserID    string `json:"user_id"`
	Choice    int    `json:"choice"`
	Timestamp int64  `json:"timestamp"`
	Weight    float64 `json:"weight"`
}

// getDemographicValue extracts the value for a specific demographic category
func (da *DemographicAnalyzer) getDemographicValue(demographics DemographicData, category DemographicCategory) string {
	switch category {
	case CategoryAge:
		return da.categorizeAge(demographics.Age)
	case CategoryGender:
		return demographics.Gender
	case CategoryLocation:
		return demographics.Location
	case CategoryEducation:
		return demographics.Education
	case CategoryIncome:
		return demographics.Income
	case CategoryTier:
		return demographics.VerificationTier
	default:
		return "unknown"
	}
}

// categorizeAge groups ages into meaningful categories
func (da *DemographicAnalyzer) categorizeAge(age int) string {
	switch {
	case age < 18:
		return "under_18"
	case age < 25:
		return "18_24"
	case age < 35:
		return "25_34"
	case age < 45:
		return "35_44"
	case age < 55:
		return "45_54"
	case age < 65:
		return "55_64"
	default:
		return "65_plus"
	}
}

// calculateGroupStatistics calculates statistics for a demographic group
func (da *DemographicAnalyzer) calculateGroupStatistics(groupName string, votes []VoteWithDemographics) DemographicGroup {
	group := DemographicGroup{
		GroupName:      groupName,
		VoteCount:      len(votes),
		ChoiceBreakdown: make(map[int]int),
		WeightedTotal:  0,
	}

	// Count votes by choice
	for _, vote := range votes {
		group.ChoiceBreakdown[vote.Vote.Choice]++
		group.WeightedTotal += vote.Vote.Weight
	}

	// Calculate confidence based on group size
	group.Confidence = da.calculateConfidence(len(votes))

	return group
}

// addNoise adds noise to protect privacy
func (da *DemographicAnalyzer) addNoise(group DemographicGroup) DemographicGroup {
	// Add noise to vote counts
	for choice, count := range group.ChoiceBreakdown {
		noise := da.generateNoise(da.noiseLevel)
		noisyCount := int(math.Max(0, float64(count)+noise))
		group.ChoiceBreakdown[choice] = noisyCount
	}

	// Add noise to weighted total
	noise := da.generateNoise(da.noiseLevel)
	group.WeightedTotal = math.Max(0, group.WeightedTotal+noise)

	return group
}

// generateNoise generates random noise for privacy protection
func (da *DemographicAnalyzer) generateNoise(level float64) float64 {
	// Generate random bytes
	bytes := make([]byte, 8)
	rand.Read(bytes)
	
	// Convert to float64 between -1 and 1
	random := float64(int(bytes[0])) / 255.0 * 2 - 1
	
	// Scale by noise level
	return random * level
}

// calculateConfidence calculates confidence level based on group size
func (da *DemographicAnalyzer) calculateConfidence(groupSize int) float64 {
	// Simple confidence calculation based on group size
	// In practice, you might use more sophisticated statistical methods
	if groupSize < da.minGroupSize {
		return 0.0
	}
	
	confidence := math.Min(1.0, float64(groupSize)/float64(da.minGroupSize*2))
	return confidence * da.confidenceLevel
}

// calculatePercentages calculates percentages for each group
func (da *DemographicAnalyzer) calculatePercentages(breakdown *DemographicBreakdown) {
	totalVotes := breakdown.TotalVotes
	if totalVotes == 0 {
		return
	}

	for groupName, group := range breakdown.Breakdown {
		group.Percentage = float64(group.VoteCount) / float64(totalVotes) * 100
		breakdown.Breakdown[groupName] = group
	}
}

// GetCrossTabulation performs cross-tabulation analysis between two demographic categories
func (da *DemographicAnalyzer) GetCrossTabulation(votes []VoteWithDemographics, category1, category2 DemographicCategory) (map[string]map[string]int, error) {
	crossTab := make(map[string]map[string]int)

	for _, vote := range votes {
		value1 := da.getDemographicValue(vote.Demographics, category1)
		value2 := da.getDemographicValue(vote.Demographics, category2)

		if crossTab[value1] == nil {
			crossTab[value1] = make(map[string]int)
		}
		crossTab[value1][value2]++
	}

	// Apply privacy protection
	da.applyPrivacyProtection(crossTab)

	return crossTab, nil
}

// applyPrivacyProtection applies privacy protection to cross-tabulation data
func (da *DemographicAnalyzer) applyPrivacyProtection(crossTab map[string]map[string]int) {
	for category1, subCategories := range crossTab {
		for category2, count := range subCategories {
			if count < da.minGroupSize {
				// Suppress small counts
				crossTab[category1][category2] = 0
			} else {
				// Add noise
				noise := da.generateNoise(da.noiseLevel)
				noisyCount := int(math.Max(0, float64(count)+noise))
				crossTab[category1][category2] = noisyCount
			}
		}
	}
}

// GetDemographicTrends analyzes voting trends across demographic categories
func (da *DemographicAnalyzer) GetDemographicTrends(votes []VoteWithDemographics, category DemographicCategory) (map[string]TrendAnalysis, error) {
	trends := make(map[string]TrendAnalysis)

	// Group votes by demographic value
	groups := make(map[string][]VoteWithDemographics)
	for _, vote := range votes {
		groupValue := da.getDemographicValue(vote.Demographics, category)
		groups[groupValue] = append(groups[groupValue], vote)
	}

	// Analyze trends for each group
	for groupName, groupVotes := range groups {
		if len(groupVotes) < da.minGroupSize {
			continue // Skip small groups
		}

		trend := da.analyzeTrend(groupVotes)
		trends[groupName] = trend
	}

	return trends, nil
}

// TrendAnalysis represents voting trend analysis for a demographic group
type TrendAnalysis struct {
	GroupName      string             `json:"group_name"`
	TotalVotes     int                `json:"total_votes"`
	ChoiceTrends   map[int]float64    `json:"choice_trends"`
	ParticipationRate float64         `json:"participation_rate"`
	Confidence     float64            `json:"confidence"`
}

// analyzeTrend analyzes voting trends for a group
func (da *DemographicAnalyzer) analyzeTrend(votes []VoteWithDemographics) TrendAnalysis {
	trend := TrendAnalysis{
		GroupName:    "unknown",
		TotalVotes:   len(votes),
		ChoiceTrends: make(map[int]float64),
		Confidence:   da.calculateConfidence(len(votes)),
	}

	// Calculate choice trends
	choiceCounts := make(map[int]int)
	totalWeight := 0.0

	for _, vote := range votes {
		choiceCounts[vote.Vote.Choice]++
		totalWeight += vote.Vote.Weight
	}

	for choice, count := range choiceCounts {
		if totalWeight > 0 {
			trend.ChoiceTrends[choice] = float64(count) / totalWeight * 100
		}
	}

	// Calculate participation rate (simplified)
	trend.ParticipationRate = float64(len(votes)) / 1000.0 // Assuming 1000 is max possible voters

	return trend
}

// ExportDemographicReport exports demographic analysis to JSON
func (da *DemographicAnalyzer) ExportDemographicReport(breakdown *DemographicBreakdown) ([]byte, error) {
	return json.MarshalIndent(breakdown, "", "  ")
}
