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
	db, err := database.NewDatabase("")
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
	_ = voting.NewTierVotingSystem()
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

	// Voting endpoints
	mux.HandleFunc("/api/v1/votes", pollService.HandleSubmitVote)
	mux.HandleFunc("/api/v1/tally", pollService.HandleGetTally)

	// Dashboard endpoints
	mux.HandleFunc("/api/v1/dashboard", dashboardService.HandleGetDashboardData)

	// Analytics endpoints
	mux.HandleFunc("/api/v1/analytics/demographics", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Mock demographic data for now
		demographics := map[string]interface{}{
			"age_groups": map[string]int{
				"18-24": 25,
				"25-34": 35,
				"35-44": 20,
				"45+":   20,
			},
			"locations": map[string]int{
				"North America": 40,
				"Europe":        30,
				"Asia":          20,
				"Other":         10,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(demographics)
	})

	// Audit endpoints
	mux.HandleFunc("/api/v1/audit/events", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		events := auditLogger.GetEvents()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"events": events,
		})
	})

	// Apply CORS middleware
	handler := middleware.CORSMiddleware()(
		middleware.LoggingMiddleware()(
			mux,
		),
	)

	// Start server
	log.Println("PO service starting on :8082")
	if err := http.ListenAndServe(":8082", handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
