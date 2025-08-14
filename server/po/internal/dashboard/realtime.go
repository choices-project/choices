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
	mu            sync.RWMutex
	metrics       map[string]*RealTimeMetrics
	updates       chan DashboardUpdate
	dashboardData *DashboardData
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

// GenerateSampleData generates comprehensive sample data for testing
func (rtd *RealTimeDashboard) GenerateSampleData() {
	// Generate multiple sample polls with realistic data
	samplePolls := []string{
		"climate-action-2024",
		"tech-priorities-2024", 
		"community-budget-2024",
		"education-reform-2024",
		"healthcare-access-2024",
	}

	for i, pollID := range samplePolls {
		// Create realistic vote counts based on poll type
		baseVotes := 800 + (i * 200)
		validVotes := baseVotes - 20
		invalidVotes := 20

		// Generate hourly vote data for the last 24 hours
		var votesPerHour []VoteCount
		for j := 24; j >= 0; j-- {
			hour := time.Now().Add(-time.Duration(j) * time.Hour)
			// Simulate realistic voting patterns (more activity during day)
			hourOfDay := hour.Hour()
			var count int
			if hourOfDay >= 9 && hourOfDay <= 17 {
				count = 15 + (j % 10) // More votes during business hours
			} else if hourOfDay >= 18 && hourOfDay <= 22 {
				count = 8 + (j % 5) // Moderate evening activity
			} else {
				count = 2 + (j % 3) // Low activity at night
			}
			votesPerHour = append(votesPerHour, VoteCount{Hour: hour, Count: count})
		}

		// Generate demographic breakdown
		demographicBreakdown := map[string]interface{}{
			"age_groups": map[string]int{
				"18-25":  150 + (i * 20),
				"26-35":  250 + (i * 30),
				"36-45":  200 + (i * 25),
				"46-55":  150 + (i * 20),
				"55+":    100 + (i * 15),
			},
			"genders": map[string]int{
				"male":   400 + (i * 50),
				"female": 350 + (i * 45),
				"other":  50 + (i * 5),
			},
			"education": map[string]int{
				"high_school": 200 + (i * 25),
				"bachelors":   400 + (i * 50),
				"masters":     150 + (i * 20),
				"phd":         50 + (i * 5),
			},
		}

		// Generate tier breakdown
		tierBreakdown := map[string]int{
			"T0": 50 + (i * 10),
			"T1": 200 + (i * 25),
			"T2": 300 + (i * 35),
			"T3": 250 + (i * 30),
		}

		// Generate geographic data
		geographicData := []GeographicVote{
			{
				Region:     "North America",
				Country:    "United States",
				Latitude:   40.7128,
				Longitude:  -74.0060,
				VoteCount:  300 + (i * 40),
				Population: 1000000,
				Percentage: 35.0 + float64(i*2),
			},
			{
				Region:     "Europe",
				Country:    "Germany",
				Latitude:   51.5074,
				Longitude:  10.4515,
				VoteCount:  200 + (i * 30),
				Population: 800000,
				Percentage: 25.0 + float64(i)*1.5,
			},
			{
				Region:     "Asia",
				Country:    "Japan",
				Latitude:   35.6762,
				Longitude:  139.6503,
				VoteCount:  150 + (i * 25),
				Population: 600000,
				Percentage: 20.0 + float64(i*1),
			},
			{
				Region:     "Oceania",
				Country:    "Australia",
				Latitude:   -33.8688,
				Longitude:  151.2093,
				VoteCount:  100 + (i * 20),
				Population: 400000,
				Percentage: 15.0 + float64(i)*0.5,
			},
		}

		// Generate recent activity
		var recentActivity []ActivityEvent
		for j := 0; j < 10; j++ {
			recentActivity = append(recentActivity, ActivityEvent{
				Timestamp: time.Now().Add(-time.Duration(j*5) * time.Minute),
				UserID:    fmt.Sprintf("user-%d-%d", i, j),
				Action:    "vote_submitted",
				Region:    []string{"North America", "Europe", "Asia", "Oceania"}[j%4],
				Tier:      []string{"T0", "T1", "T2", "T3"}[j%4],
			})
		}

		sampleMetrics := &RealTimeMetrics{
			PollID:            pollID,
			TotalVotes:        baseVotes,
			ValidVotes:        validVotes,
			InvalidVotes:      invalidVotes,
			ParticipationRate: 75.0 + float64(i*2),
			VotesPerHour:      votesPerHour,
			DemographicBreakdown: demographicBreakdown,
			TierBreakdown:     tierBreakdown,
			GeographicData:    geographicData,
			RecentActivity:    recentActivity,
			LastUpdated:       time.Now(),
		}
		
		rtd.UpdatePollMetrics(pollID, sampleMetrics)
	}

	// Generate comprehensive dashboard data
	dashboardData := &DashboardData{
		Polls: []PollSummary{
			{
				ID:            "climate-action-2024",
				Title:         "Climate Action Priorities 2024",
				Status:        "active",
				TotalVotes:    1200,
				Participation: 85.5,
				CreatedAt:     time.Now().Add(-7 * 24 * time.Hour),
				EndsAt:        time.Now().Add(3 * 24 * time.Hour),
				Choices: []Choice{
					{ID: "1", Text: "Renewable Energy Investment", Votes: 450},
					{ID: "2", Text: "Carbon Tax Implementation", Votes: 320},
					{ID: "3", Text: "Public Transportation", Votes: 280},
					{ID: "4", Text: "Green Building Standards", Votes: 150},
				},
			},
			{
				ID:            "tech-priorities-2024",
				Title:         "Technology Development Priorities",
				Status:        "active",
				TotalVotes:    980,
				Participation: 72.3,
				CreatedAt:     time.Now().Add(-5 * 24 * time.Hour),
				EndsAt:        time.Now().Add(5 * 24 * time.Hour),
				Choices: []Choice{
					{ID: "1", Text: "Artificial Intelligence", Votes: 380},
					{ID: "2", Text: "Quantum Computing", Votes: 220},
					{ID: "3", Text: "Cybersecurity", Votes: 280},
					{ID: "4", Text: "Blockchain Technology", Votes: 100},
				},
			},
			{
				ID:            "community-budget-2024",
				Title:         "Community Budget Allocation",
				Status:        "active",
				TotalVotes:    750,
				Participation: 68.2,
				CreatedAt:     time.Now().Add(-3 * 24 * time.Hour),
				EndsAt:        time.Now().Add(7 * 24 * time.Hour),
				Choices: []Choice{
					{ID: "1", Text: "Education & Schools", Votes: 300},
					{ID: "2", Text: "Public Safety", Votes: 200},
					{ID: "3", Text: "Parks & Recreation", Votes: 150},
					{ID: "4", Text: "Infrastructure", Votes: 100},
				},
			},
			{
				ID:            "education-reform-2024",
				Title:         "Education System Reform",
				Status:        "closed",
				TotalVotes:    1500,
				Participation: 92.1,
				CreatedAt:     time.Now().Add(-14 * 24 * time.Hour),
				EndsAt:        time.Now().Add(-2 * 24 * time.Hour),
				Choices: []Choice{
					{ID: "1", Text: "Digital Learning Tools", Votes: 600},
					{ID: "2", Text: "Teacher Training", Votes: 450},
					{ID: "3", Text: "Curriculum Updates", Votes: 300},
					{ID: "4", Text: "Infrastructure", Votes: 150},
				},
			},
			{
				ID:            "healthcare-access-2024",
				Title:         "Healthcare Access Improvement",
				Status:        "active",
				TotalVotes:    1100,
				Participation: 78.9,
				CreatedAt:     time.Now().Add(-2 * 24 * time.Hour),
				EndsAt:        time.Now().Add(8 * 24 * time.Hour),
				Choices: []Choice{
					{ID: "1", Text: "Telemedicine Expansion", Votes: 400},
					{ID: "2", Text: "Mental Health Services", Votes: 350},
					{ID: "3", Text: "Preventive Care", Votes: 250},
					{ID: "4", Text: "Emergency Services", Votes: 100},
				},
			},
		},
		OverallMetrics: OverallMetrics{
			TotalPolls:            5,
			ActivePolls:           4,
			TotalVotes:            5530,
			TotalUsers:            3200,
			AverageParticipation:  79.4,
		},
		Trends: []TrendData{
			{Date: time.Now().Add(-7 * 24 * time.Hour), Votes: 1200, Users: 800, Polls: 2},
			{Date: time.Now().Add(-6 * 24 * time.Hour), Votes: 1350, Users: 950, Polls: 3},
			{Date: time.Now().Add(-5 * 24 * time.Hour), Votes: 980, Users: 720, Polls: 3},
			{Date: time.Now().Add(-4 * 24 * time.Hour), Votes: 1100, Users: 850, Polls: 3},
			{Date: time.Now().Add(-3 * 24 * time.Hour), Votes: 750, Users: 680, Polls: 4},
			{Date: time.Now().Add(-2 * 24 * time.Hour), Votes: 1500, Users: 1200, Polls: 4},
			{Date: time.Now().Add(-1 * 24 * time.Hour), Votes: 1100, Users: 890, Polls: 5},
			{Date: time.Now(), Votes: 800, Users: 650, Polls: 5},
		},
		GeographicMap: GeographicMap{
			Regions: []GeographicRegion{
				{Name: "North America", VoteCount: 1800, Percentage: 32.5},
				{Name: "Europe", VoteCount: 1200, Percentage: 21.7},
				{Name: "Asia", VoteCount: 900, Percentage: 16.3},
				{Name: "Oceania", VoteCount: 600, Percentage: 10.8},
				{Name: "South America", VoteCount: 500, Percentage: 9.0},
				{Name: "Africa", VoteCount: 530, Percentage: 9.6},
			},
			Countries: []GeographicCountry{
				{Name: "United States", VoteCount: 1200, Percentage: 21.7},
				{Name: "Germany", VoteCount: 800, Percentage: 14.5},
				{Name: "Japan", VoteCount: 600, Percentage: 10.8},
				{Name: "Australia", VoteCount: 400, Percentage: 7.2},
				{Name: "Canada", VoteCount: 600, Percentage: 10.8},
			},
		},
		Demographics: DemographicsData{
			AgeGroups: map[string]int{
				"18-25":  850,
				"26-35":  1400,
				"36-45":  1200,
				"46-55":  900,
				"55+":    580,
			},
			Genders: map[string]int{
				"male":   2800,
				"female": 2450,
				"other":  280,
			},
			Education: map[string]int{
				"high_school": 1100,
				"bachelors":   2200,
				"masters":     900,
				"phd":         330,
			},
			Income: map[string]int{
				"low":     1200,
				"medium":  2000,
				"high":    1800,
			},
			VerificationTiers: map[string]int{
				"T0": 400,
				"T1": 1200,
				"T2": 1600,
				"T3": 1400,
			},
		},
		Engagement: EngagementMetrics{
			ActiveUsers:     2850,
			NewUsers:        450,
			ReturningUsers:  2400,
			SessionDuration: 12.5,
			BounceRate:      18.3,
		},
	}

	rtd.dashboardData = dashboardData
}

// ExportMetrics exports metrics as JSON
func (rtd *RealTimeDashboard) ExportMetrics(pollID string) ([]byte, error) {
	metrics, err := rtd.GetPollMetrics(pollID)
	if err != nil {
		return nil, err
	}
	
	return json.MarshalIndent(metrics, "", "  ")
}
