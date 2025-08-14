package main

import (
	"fmt"
	"log"
	"net/http"

	"choice/po/internal/api"
)

func main() {
	// For now, we'll use a hardcoded IA public key
	// In production, this would be fetched from the IA service
	iaPublicKey := "6f0c2a37090a7bc2f7e670c07afa333edc06fe62759b1add546912c2f294787d"

	// Create poll service
	pollService, err := api.NewPollService(iaPublicKey)
	if err != nil {
		log.Fatalf("Failed to create poll service: %v", err)
	}

	// Health check endpoint
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "ok")
	})

	// Poll management endpoints
	http.HandleFunc("/api/v1/polls", pollService.HandleCreatePoll)
	http.HandleFunc("/api/v1/polls/list", pollService.HandleListPolls)
	http.HandleFunc("/api/v1/polls/get", pollService.HandleGetPoll)
	http.HandleFunc("/api/v1/polls/activate", pollService.HandleActivatePoll)
	http.HandleFunc("/api/v1/polls/close", pollService.HandleClosePoll)

	// Voting endpoints
	http.HandleFunc("/api/v1/votes", pollService.HandleSubmitVote)
	http.HandleFunc("/api/v1/tally", pollService.HandleGetTally)

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
	
	log.Fatal(http.ListenAndServe(":8082", nil))
}
