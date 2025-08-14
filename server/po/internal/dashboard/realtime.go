package dashboard

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// RealTimeMetrics represents live metrics for dashboard display
type RealTimeMetrics struct {
	PollID              string                 `json:"poll_id"`
	TotalVotes          int                    `json:"total_votes"`
	ValidVotes          int                    `json:"valid_votes"`
	InvalidVotes        int                    `json:"invalid_votes"`
	ParticipationRate   float64                `json:"participation_rate"`
	VotesPerHour        []VoteCount            `json:"votes_per_hour"`
	DemographicBreakdown map[string]interface{} `json:"demographic_breakdown"`
	TierBreakdown       map[string]int         `json:"tier_breakdown"`
	GeographicData      []GeographicVote       `json:"geographic_data"`
	RecentActivity      []ActivityEvent        `json:"recent_activity"`
	LastUpdated         time.Time              `json:"last_updated"`
}

// VoteCount represents vote counts over time
type VoteCount struct {
	Hour  time.Time `json:"hour"`
	Count int       `json:"count"`
}

// GeographicVote represents voting data by location
type GeographicVote struct {
	Region     string  `json:"region"`
	Country    string  `json:"country"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	VoteCount  int     `json:"vote_count"`
	Population int     `json:"population"`
	Percentage float64 `json:"percentage"`
}

// ActivityEvent represents recent voting activity
type ActivityEvent struct {
	Timestamp time.Time `json:"timestamp"`
	UserID    string    `json:"user_id"`
	Action    string    `json:"action"`
	Region    string    `json:"region"`
	Tier      string    `json:"tier"`
}

// DashboardData represents comprehensive dashboard data
type DashboardData struct {
	Polls           []PollSummary     `json:"polls"`
	OverallMetrics  OverallMetrics    `json:"overall_metrics"`
	Trends          []TrendData       `json:"trends"`
	GeographicMap   GeographicMap     `json:"geographic_map"`
	Demographics    DemographicsData  `json:"demographics"`
	Engagement      EngagementMetrics `json:"engagement"`
}

// PollSummary represents summary data for a poll
type PollSummary struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	Status          string    `json:"status"`
	TotalVotes      int       `json:"total_votes"`
	Participation   float64   `json:"participation"`
	CreatedAt       time.Time `json:"created_at"`
	EndsAt          time.Time `json:"ends_at"`
	Choices         []Choice  `json:"choices"`
}

// Choice represents a poll choice with vote counts
type Choice struct {
	ID    string `json:"id"`
	Text  string `json:"text"`
	Votes int    `json:"votes"`
}

// OverallMetrics represents system-wide metrics
type OverallMetrics struct {
	TotalPolls       int     `json:"total_polls"`
	ActivePolls      int     `json:"active_polls"`
	TotalVotes       int     `json:"total_votes"`
	TotalUsers       int     `json:"total_users"`
	AverageParticipation float64 `json:"average_participation"`
}

// TrendData represents trend information
type TrendData struct {
	Date     time.Time `json:"date"`
	Votes    int       `json:"votes"`
	Users    int       `json:"users"`
	Polls    int       `json:"polls"`
}

// GeographicMap represents geographic voting data
type GeographicMap struct {
	Regions []GeographicRegion `json:"regions"`
	Countries []GeographicCountry `json:"countries"`
	Heatmap  []HeatmapPoint     `json:"heatmap"`
}

// GeographicRegion represents a geographic region
type GeographicRegion struct {
	Name        string  `json:"name"`
	VoteCount   int     `json:"vote_count"`
	Population  int     `json:"population"`
	Percentage  float64 `json:"percentage"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
}

// GeographicCountry represents a country
type GeographicCountry struct {
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	VoteCount   int     `json:"vote_count"`
	Population  int     `json:"population"`
	Percentage  float64 `json:"percentage"`
}

// HeatmapPoint represents a heatmap data point
type HeatmapPoint struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Intensity float64 `json:"intensity"`
}

// DemographicsData represents demographic breakdown
type DemographicsData struct {
	AgeGroups    map[string]int     `json:"age_groups"`
	Genders      map[string]int     `json:"genders"`
	Education    map[string]int     `json:"education"`
	Income       map[string]int     `json:"income"`
	VerificationTiers map[string]int `json:"verification_tiers"`
}

// EngagementMetrics represents engagement data
type EngagementMetrics struct {
	ActiveUsers     int     `json:"active_users"`
	NewUsers        int     `json:"new_users"`
	ReturningUsers  int     `json:"returning_users"`
	SessionDuration float64 `json:"session_duration"`
	BounceRate      float64 `json:"bounce_rate"`
}

// RealTimeDashboard provides real-time dashboard functionality
type RealTimeDashboard struct {
	mu       sync.RWMutex
	metrics  map[string]*RealTimeMetrics
	updates  chan DashboardUpdate
}

// DashboardUpdate represents a dashboard update
type DashboardUpdate struct {
	PollID string
	Type   string
	Data   interface{}
}

// NewRealTimeDashboard creates a new real-time dashboard
func NewRealTimeDashboard() *RealTimeDashboard {
	return &RealTimeDashboard{
		metrics: make(map[string]*RealTimeMetrics),
		updates: make(chan DashboardUpdate, 100),
	}
}

// GetPollMetrics returns real-time metrics for a specific poll
func (rtd *RealTimeDashboard) GetPollMetrics(pollID string) (*RealTimeMetrics, error) {
	rtd.mu.RLock()
	defer rtd.mu.RUnlock()
	
	metrics, exists := rtd.metrics[pollID]
	if !exists {
		return nil, fmt.Errorf("poll %s not found", pollID)
	}
	
	return metrics, nil
}

// GetAllMetrics returns metrics for all polls
func (rtd *RealTimeDashboard) GetAllMetrics() map[string]*RealTimeMetrics {
	rtd.mu.RLock()
	defer rtd.mu.RUnlock()
	
	result := make(map[string]*RealTimeMetrics)
	for k, v := range rtd.metrics {
		result[k] = v
	}
	return result
}

// UpdatePollMetrics updates metrics for a specific poll
func (rtd *RealTimeDashboard) UpdatePollMetrics(pollID string, metrics *RealTimeMetrics) {
	rtd.mu.Lock()
	defer rtd.mu.Unlock()
	
	metrics.LastUpdated = time.Now()
	rtd.metrics[pollID] = metrics
	
	// Send update notification
	select {
	case rtd.updates <- DashboardUpdate{
		PollID: pollID,
		Type:   "metrics_update",
		Data:   metrics,
	}:
	default:
		// Channel full, skip update
	}
}

// GetDashboardData returns comprehensive dashboard data
func (rtd *RealTimeDashboard) GetDashboardData() (*DashboardData, error) {
	rtd.mu.RLock()
	defer rtd.mu.RUnlock()
	
	// This would typically query the database for comprehensive data
	// For now, we'll return a sample structure
	data := &DashboardData{
		Polls: []PollSummary{
			{
				ID:            "poll-1",
				Title:         "Sample Poll",
				Status:        "active",
				TotalVotes:    1250,
				Participation: 85.5,
				CreatedAt:     time.Now().Add(-24 * time.Hour),
				EndsAt:        time.Now().Add(24 * time.Hour),
				Choices: []Choice{
					{ID: "choice-1", Text: "Option A", Votes: 650},
					{ID: "choice-2", Text: "Option B", Votes: 600},
				},
			},
		},
		OverallMetrics: OverallMetrics{
			TotalPolls:           5,
			ActivePolls:          3,
			TotalVotes:           1250,
			TotalUsers:           850,
			AverageParticipation: 78.2,
		},
		Trends: []TrendData{
			{
				Date:  time.Now().Add(-24 * time.Hour),
				Votes: 1250,
				Users: 850,
				Polls: 5,
			},
		},
		GeographicMap: GeographicMap{
			Regions: []GeographicRegion{
				{
					Name:       "North America",
					VoteCount:  450,
					Population: 1000000,
					Percentage: 36.0,
					Latitude:   40.7128,
					Longitude:  -74.0060,
				},
			},
			Countries: []GeographicCountry{
				{
					Code:       "US",
					Name:       "United States",
					VoteCount:  450,
					Population: 1000000,
					Percentage: 36.0,
				},
			},
			Heatmap: []HeatmapPoint{
				{
					Latitude:  40.7128,
					Longitude: -74.0060,
					Intensity: 0.8,
				},
			},
		},
		Demographics: DemographicsData{
			AgeGroups: map[string]int{
				"18-25":  200,
				"26-35":  350,
				"36-45":  300,
				"46-55":  250,
				"55+":    150,
			},
			Genders: map[string]int{
				"male":   600,
				"female": 550,
				"other":  100,
			},
			Education: map[string]int{
				"high_school": 200,
				"bachelor":    500,
				"master":      300,
				"phd":         250,
			},
			Income: map[string]int{
				"low":     300,
				"medium":  500,
				"high":    450,
			},
			VerificationTiers: map[string]int{
				"T0": 100,
				"T1": 300,
				"T2": 400,
				"T3": 450,
			},
		},
		Engagement: EngagementMetrics{
			ActiveUsers:     850,
			NewUsers:        150,
			ReturningUsers:  700,
			SessionDuration: 8.5,
			BounceRate:      15.2,
		},
	}
	
	return data, nil
}

// GetUpdatesChannel returns the channel for real-time updates
func (rtd *RealTimeDashboard) GetUpdatesChannel() <-chan DashboardUpdate {
	return rtd.updates
}

// GenerateSampleData generates sample data for testing
func (rtd *RealTimeDashboard) GenerateSampleData() {
	sampleMetrics := &RealTimeMetrics{
		PollID:            "sample-poll",
		TotalVotes:        1250,
		ValidVotes:        1200,
		InvalidVotes:      50,
		ParticipationRate: 85.5,
		VotesPerHour: []VoteCount{
			{Hour: time.Now().Add(-1 * time.Hour), Count: 45},
			{Hour: time.Now().Add(-2 * time.Hour), Count: 52},
			{Hour: time.Now().Add(-3 * time.Hour), Count: 38},
		},
		DemographicBreakdown: map[string]interface{}{
			"age_groups": map[string]int{
				"18-25":  200,
				"26-35":  350,
				"36-45":  300,
				"46-55":  250,
				"55+":    150,
			},
			"genders": map[string]int{
				"male":   600,
				"female": 550,
				"other":  100,
			},
		},
		TierBreakdown: map[string]int{
			"T0": 100,
			"T1": 300,
			"T2": 400,
			"T3": 450,
		},
		GeographicData: []GeographicVote{
			{
				Region:     "North America",
				Country:    "United States",
				Latitude:   40.7128,
				Longitude:  -74.0060,
				VoteCount:  450,
				Population: 1000000,
				Percentage: 36.0,
			},
			{
				Region:     "Europe",
				Country:    "Germany",
				Latitude:   51.5074,
				Longitude:  10.4515,
				VoteCount:  300,
				Population: 800000,
				Percentage: 24.0,
			},
		},
		RecentActivity: []ActivityEvent{
			{
				Timestamp: time.Now().Add(-5 * time.Minute),
				UserID:    "user-123",
				Action:    "vote_submitted",
				Region:    "North America",
				Tier:      "T2",
			},
		},
		LastUpdated: time.Now(),
	}
	
	rtd.UpdatePollMetrics("sample-poll", sampleMetrics)
}

// ExportMetrics exports metrics as JSON
func (rtd *RealTimeDashboard) ExportMetrics(pollID string) ([]byte, error) {
	metrics, err := rtd.GetPollMetrics(pollID)
	if err != nil {
		return nil, err
	}
	
	return json.MarshalIndent(metrics, "", "  ")
}
