package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"choice/po/internal/dashboard"
)

// DashboardService handles dashboard-related API requests
type DashboardService struct {
	dashboard *dashboard.RealTimeDashboard
}

// NewDashboardService creates a new dashboard service
func NewDashboardService(dashboard *dashboard.RealTimeDashboard) *DashboardService {
	return &DashboardService{
		dashboard: dashboard,
	}
}

// HandleGetDashboardData returns comprehensive dashboard data
func (ds *DashboardService) HandleGetDashboardData(w http.ResponseWriter, r *http.Request) {
	data, err := ds.dashboard.GetDashboardData()
	if err != nil {
		http.Error(w, "Failed to get dashboard data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

// HandleGetPollMetrics returns real-time metrics for a specific poll
func (ds *DashboardService) HandleGetPollMetrics(w http.ResponseWriter, r *http.Request) {
	pollID := r.URL.Query().Get("poll_id")
	if pollID == "" {
		http.Error(w, "poll_id parameter is required", http.StatusBadRequest)
		return
	}

	metrics, err := ds.dashboard.GetPollMetrics(pollID)
	if err != nil {
		http.Error(w, "Poll not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

// HandleGetAllMetrics returns metrics for all polls
func (ds *DashboardService) HandleGetAllMetrics(w http.ResponseWriter, r *http.Request) {
	metrics := ds.dashboard.GetAllMetrics()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

// HandleGetGeographicData returns geographic voting data
func (ds *DashboardService) HandleGetGeographicData(w http.ResponseWriter, r *http.Request) {
	pollID := r.URL.Query().Get("poll_id")
	
	var geographicData []dashboard.GeographicVote
	
	if pollID != "" {
		// Get specific poll data
		metrics, err := ds.dashboard.GetPollMetrics(pollID)
		if err != nil {
			http.Error(w, "Poll not found", http.StatusNotFound)
			return
		}
		geographicData = metrics.GeographicData
	} else {
		// Get all geographic data
		allMetrics := ds.dashboard.GetAllMetrics()
		for _, metrics := range allMetrics {
			geographicData = append(geographicData, metrics.GeographicData...)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(geographicData)
}

// HandleGetDemographics returns demographic breakdown data
func (ds *DashboardService) HandleGetDemographics(w http.ResponseWriter, r *http.Request) {
	pollID := r.URL.Query().Get("poll_id")
	
	if pollID != "" {
		// Get specific poll demographics
		metrics, err := ds.dashboard.GetPollMetrics(pollID)
		if err != nil {
			http.Error(w, "Poll not found", http.StatusNotFound)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(metrics.DemographicBreakdown)
	} else {
		// Get overall demographics
		data, err := ds.dashboard.GetDashboardData()
		if err != nil {
			http.Error(w, "Failed to get demographics", http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data.Demographics)
	}
}

// HandleGetTrends returns trend data
func (ds *DashboardService) HandleGetTrends(w http.ResponseWriter, r *http.Request) {
	daysStr := r.URL.Query().Get("days")
	days := 7 // Default to 7 days
	
	if daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}

	// Generate sample trend data
	var trends []dashboard.TrendData
	now := time.Now()
	
	for i := days; i >= 0; i-- {
		date := now.AddDate(0, 0, -i)
		trends = append(trends, dashboard.TrendData{
			Date:  date,
			Votes: 100 + (i * 50), // Sample data
			Users: 80 + (i * 30),
			Polls: 3 + (i % 3),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(trends)
}

// HandleGetEngagement returns engagement metrics
func (ds *DashboardService) HandleGetEngagement(w http.ResponseWriter, r *http.Request) {
	data, err := ds.dashboard.GetDashboardData()
	if err != nil {
		http.Error(w, "Failed to get engagement data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data.Engagement)
}

// HandleGetRecentActivity returns recent activity events
func (ds *DashboardService) HandleGetRecentActivity(w http.ResponseWriter, r *http.Request) {
	pollID := r.URL.Query().Get("poll_id")
	limitStr := r.URL.Query().Get("limit")
	limit := 50 // Default limit
	
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	var allActivity []dashboard.ActivityEvent
	
	if pollID != "" {
		// Get specific poll activity
		metrics, err := ds.dashboard.GetPollMetrics(pollID)
		if err != nil {
			http.Error(w, "Poll not found", http.StatusNotFound)
			return
		}
		allActivity = metrics.RecentActivity
	} else {
		// Get all activity
		allMetrics := ds.dashboard.GetAllMetrics()
		for _, metrics := range allMetrics {
			allActivity = append(allActivity, metrics.RecentActivity...)
		}
	}

	// Limit the results
	if len(allActivity) > limit {
		allActivity = allActivity[:limit]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(allActivity)
}

// HandleExportMetrics exports metrics as JSON
func (ds *DashboardService) HandleExportMetrics(w http.ResponseWriter, r *http.Request) {
	pollID := r.URL.Query().Get("poll_id")
	if pollID == "" {
		http.Error(w, "poll_id parameter is required", http.StatusBadRequest)
		return
	}

	data, err := ds.dashboard.ExportMetrics(pollID)
	if err != nil {
		http.Error(w, "Failed to export metrics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=metrics-"+pollID+".json")
	w.Write(data)
}

// HandleGetHeatmapData returns heatmap data for geographic visualization
func (ds *DashboardService) HandleGetHeatmapData(w http.ResponseWriter, r *http.Request) {
	pollID := r.URL.Query().Get("poll_id")
	
	var heatmapData []dashboard.HeatmapPoint
	
	if pollID != "" {
		// Get specific poll heatmap
		metrics, err := ds.dashboard.GetPollMetrics(pollID)
		if err != nil {
			http.Error(w, "Poll not found", http.StatusNotFound)
			return
		}
		
		// Convert geographic data to heatmap points
		for _, geo := range metrics.GeographicData {
			intensity := float64(geo.VoteCount) / float64(geo.Population)
			heatmapData = append(heatmapData, dashboard.HeatmapPoint{
				Latitude:  geo.Latitude,
				Longitude: geo.Longitude,
				Intensity: intensity,
			})
		}
	} else {
		// Get overall heatmap data
		data, err := ds.dashboard.GetDashboardData()
		if err != nil {
			http.Error(w, "Failed to get heatmap data", http.StatusInternalServerError)
			return
		}
		heatmapData = data.GeographicMap.Heatmap
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(heatmapData)
}

// HandleGetVoteTimeline returns vote counts over time
func (ds *DashboardService) HandleGetVoteTimeline(w http.ResponseWriter, r *http.Request) {
	pollID := r.URL.Query().Get("poll_id")
	if pollID == "" {
		http.Error(w, "poll_id parameter is required", http.StatusBadRequest)
		return
	}

	metrics, err := ds.dashboard.GetPollMetrics(pollID)
	if err != nil {
		http.Error(w, "Poll not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics.VotesPerHour)
}

// HandleGetTierBreakdown returns tier-based voting breakdown
func (ds *DashboardService) HandleGetTierBreakdown(w http.ResponseWriter, r *http.Request) {
	pollID := r.URL.Query().Get("poll_id")
	
	if pollID != "" {
		// Get specific poll tier breakdown
		metrics, err := ds.dashboard.GetPollMetrics(pollID)
		if err != nil {
			http.Error(w, "Poll not found", http.StatusNotFound)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(metrics.TierBreakdown)
	} else {
		// Get overall tier breakdown
		data, err := ds.dashboard.GetDashboardData()
		if err != nil {
			http.Error(w, "Failed to get tier breakdown", http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data.Demographics.VerificationTiers)
	}
}
