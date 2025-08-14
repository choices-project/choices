package main

import (
	"fmt"
	"log"
	"net/http"

	"choice/po/internal/api"
	"choice/po/internal/database"
	"choice/po/internal/middleware"
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
	
	log.Fatal(http.ListenAndServe(":8082", handler))
}
