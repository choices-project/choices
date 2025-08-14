package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"choice/po/internal/analytics"
	"choice/po/internal/api"
	"choice/po/internal/audit"
	"choice/po/internal/dashboard"
	"choice/po/internal/database"
	"choice/po/internal/middleware"
	"choice/po/internal/privacy"
	"choice/po/internal/tally"
	"choice/po/internal/voting"
)

func main() {
	// Initialize database
	db, err := database.NewDatabase("data/po.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Create repositories
	pollRepo := database.NewPollRepository(db)
	voteRepo := database.NewVoteRepository(db)
	merkleTreeRepo := database.NewMerkleTreeRepository(db)

	// Initialize Phase 7 components
	auditLogger := audit.NewAuditLogger()
	tierVotingSystem := voting.NewTierVotingSystem()
	_ = analytics.NewDemographicAnalyzer(10, 0.1, 0.95) // minGroupSize=10, noiseLevel=0.1, confidenceLevel=0.95
	_ = privacy.NewDifferentialPrivacy(1.0, 0.0001) // epsilon=1.0, delta=0.0001
	_ = tally.NewReproducibleTally("1.0", "weighted-voting")
	
	// Initialize Phase 8: Real-time Dashboard
	realTimeDashboard := dashboard.NewRealTimeDashboard()
	dashboardService := api.NewDashboardService(realTimeDashboard)
	
	// Generate sample data for testing
	realTimeDashboard.GenerateSampleData()

	// For now, we'll use a hardcoded IA public key
	// In production, this would be fetched from the IA service
	iaPublicKey := "6f0c2a37090a7bc2f7e670c07afa333edc06fe62759b1add546912c2f294787d"

	// Create poll service
	pollService, err := api.NewPollService(iaPublicKey, pollRepo, voteRepo, merkleTreeRepo)
	if err != nil {
		log.Fatalf("Failed to create poll service: %v", err)
	}

	// Create middleware chain
	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})

	// Poll management endpoints
	mux.HandleFunc("/api/v1/polls", pollService.HandleCreatePoll)
	mux.HandleFunc("/api/v1/polls/list", pollService.HandleListPolls)
	mux.HandleFunc("/api/v1/polls/get", pollService.HandleGetPoll)
	mux.HandleFunc("/api/v1/polls/activate", pollService.HandleActivatePoll)
	mux.HandleFunc("/api/v1/polls/close", pollService.HandleClosePoll)

	// Voting endpoints with rate limiting
	mux.HandleFunc("/api/v1/votes", pollService.HandleSubmitVote)
	mux.HandleFunc("/api/v1/tally", pollService.HandleGetTally)

	// Commitment and audit endpoints
	mux.HandleFunc("/api/v1/commitment", pollService.HandleGetCommitmentLog)
	mux.HandleFunc("/api/v1/verify", pollService.HandleVerifyProof)

	// Phase 7: Advanced Features endpoints
	// Audit endpoints
	mux.HandleFunc("/api/v1/audit/events", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		events := auditLogger.GetEvents()
		jsonData, err := json.Marshal(events)
		if err != nil {
			http.Error(w, "Failed to marshal events", http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonData)
	})

	mux.HandleFunc("/api/v1/audit/export", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		jsonData, err := auditLogger.ExportAuditLog()
		if err != nil {
			http.Error(w, "Failed to export audit log", http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonData)
	})

	// Tier voting endpoints
	mux.HandleFunc("/api/v1/tiers/weights", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		weights := tierVotingSystem.GetTierWeights()
		jsonData, err := json.Marshal(weights)
		if err != nil {
			http.Error(w, "Failed to marshal weights", http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonData)
	})

	// Demographic analysis endpoints
	mux.HandleFunc("/api/v1/analytics/demographics", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		pollID := r.URL.Query().Get("poll_id")
		category := r.URL.Query().Get("category")
		
		if pollID == "" || category == "" {
			http.Error(w, "Missing poll_id or category parameter", http.StatusBadRequest)
			return
		}
		
		// For now, return a placeholder response
		// In a full implementation, you would fetch votes and analyze demographics
		response := map[string]interface{}{
			"poll_id":  pollID,
			"category": category,
			"message":  "Demographic analysis endpoint - implementation pending",
		}
		
		jsonData, err := json.Marshal(response)
		if err != nil {
			http.Error(w, "Failed to marshal response", http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonData)
	})

	// Reproducible tally endpoints
	mux.HandleFunc("/api/v1/tally/reproducible", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		pollID := r.URL.Query().Get("poll_id")
		if pollID == "" {
			http.Error(w, "Missing poll_id parameter", http.StatusBadRequest)
			return
		}
		
		// For now, return a placeholder response
		// In a full implementation, you would fetch votes and compute reproducible tally
		response := map[string]interface{}{
			"poll_id":  pollID,
			"message":  "Reproducible tally endpoint - implementation pending",
		}
		
		jsonData, err := json.Marshal(response)
		if err != nil {
			http.Error(w, "Failed to marshal response", http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonData)
	})

	// Phase 8: Real-time Dashboard endpoints
	mux.HandleFunc("/api/v1/dashboard", dashboardService.HandleGetDashboardData)
	mux.HandleFunc("/api/v1/dashboard/metrics", dashboardService.HandleGetPollMetrics)
	mux.HandleFunc("/api/v1/dashboard/all-metrics", dashboardService.HandleGetAllMetrics)
	mux.HandleFunc("/api/v1/dashboard/geographic", dashboardService.HandleGetGeographicData)
	mux.HandleFunc("/api/v1/dashboard/demographics", dashboardService.HandleGetDemographics)
	mux.HandleFunc("/api/v1/dashboard/trends", dashboardService.HandleGetTrends)
	mux.HandleFunc("/api/v1/dashboard/engagement", dashboardService.HandleGetEngagement)
	mux.HandleFunc("/api/v1/dashboard/activity", dashboardService.HandleGetRecentActivity)
	mux.HandleFunc("/api/v1/dashboard/export", dashboardService.HandleExportMetrics)
	mux.HandleFunc("/api/v1/dashboard/heatmap", dashboardService.HandleGetHeatmapData)
	mux.HandleFunc("/api/v1/dashboard/timeline", dashboardService.HandleGetVoteTimeline)
	mux.HandleFunc("/api/v1/dashboard/tier-breakdown", dashboardService.HandleGetTierBreakdown)

	// Apply middleware chain
	handler := middleware.CORSMiddleware()(
		middleware.LoggingMiddleware()(
			middleware.VoteRateLimitMiddleware()(
				mux,
			),
		),
	)

	log.Println("PO listening on :8082")
	log.Println("Available endpoints:")
	log.Println("  GET  /healthz")
	log.Println("  POST /api/v1/polls")
	log.Println("  GET  /api/v1/polls/list")
	log.Println("  GET  /api/v1/polls/get?id=<poll_id>")
	log.Println("  POST /api/v1/polls/activate?poll_id=<poll_id>")
	log.Println("  POST /api/v1/polls/close?poll_id=<poll_id>")
	log.Println("  POST /api/v1/votes?poll_id=<poll_id>")
	log.Println("  GET  /api/v1/tally?poll_id=<poll_id>")
	log.Println("  GET  /api/v1/commitment?poll_id=<poll_id>")
	log.Println("  POST /api/v1/verify?poll_id=<poll_id>")
	log.Println("  GET  /api/v1/audit/events")
	log.Println("  GET  /api/v1/audit/export")
	log.Println("  GET  /api/v1/tiers/weights")
	log.Println("  GET  /api/v1/analytics/demographics?poll_id=<poll_id>&category=<category>")
	log.Println("  GET  /api/v1/tally/reproducible?poll_id=<poll_id>")
	log.Println("  GET  /api/v1/dashboard")
	log.Println("  GET  /api/v1/dashboard/metrics?poll_id=<poll_id>")
	log.Println("  GET  /api/v1/dashboard/geographic?poll_id=<poll_id>")
	log.Println("  GET  /api/v1/dashboard/demographics?poll_id=<poll_id>")
	log.Println("  GET  /api/v1/dashboard/trends?days=<days>")
	log.Println("  GET  /api/v1/dashboard/engagement")
	log.Println("  GET  /api/v1/dashboard/activity?poll_id=<poll_id>&limit=<limit>")
	log.Println("  GET  /api/v1/dashboard/heatmap?poll_id=<poll_id>")
	log.Println("  GET  /api/v1/dashboard/timeline?poll_id=<poll_id>")
	log.Println("  GET  /api/v1/dashboard/tier-breakdown?poll_id=<poll_id>")
	
	log.Fatal(http.ListenAndServe(":8082", handler))
}
