package poll

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"choice/po/internal/database"
	"choice/po/internal/merkle"
)

// Poll represents a polling event
type Poll struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Options     []string  `json:"options"`
	CreatedAt   time.Time `json:"created_at"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Status      string    `json:"status"` // "draft", "active", "closed"
	Sponsors    []string  `json:"sponsors"`
	PublicKey   string    `json:"public_key"` // IA public key for verification
}

// Vote represents a single vote in a poll
type Vote struct {
	PollID      string    `json:"poll_id"`
	Token       string    `json:"token"`
	Tag         string    `json:"tag"`
	Choice      int       `json:"choice"`
	VotedAt     time.Time `json:"voted_at"`
	MerkleLeaf  string    `json:"merkle_leaf"`
	MerkleProof []string  `json:"merkle_proof"`
}

// PollManager manages polls and votes
type PollManager struct {
	pollRepo       *database.PollRepository
	voteRepo       *database.VoteRepository
	merkleTreeRepo *database.MerkleTreeRepository
	merkleTrees    map[string]*merkle.MerkleTree // pollID -> Merkle tree (in-memory for now)
	mutex          sync.RWMutex
}

// NewPollManager creates a new poll manager
func NewPollManager(pollRepo *database.PollRepository, voteRepo *database.VoteRepository, merkleTreeRepo *database.MerkleTreeRepository) *PollManager {
	return &PollManager{
		pollRepo:       pollRepo,
		voteRepo:       voteRepo,
		merkleTreeRepo: merkleTreeRepo,
		merkleTrees:    make(map[string]*merkle.MerkleTree),
	}
}

// CreatePoll creates a new poll
func (pm *PollManager) CreatePoll(title, description string, options []string, startTime, endTime time.Time, sponsors []string, iaPublicKey string) (*Poll, error) {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	// Generate poll ID
	pollID := generatePollID(title, time.Now())

	// Create poll in database
	dbPoll := &database.Poll{
		PollID:      pollID,
		Title:       title,
		Description: description,
		Options:     options,
		StartTime:   startTime,
		EndTime:     endTime,
		Status:      "draft",
		Sponsors:    sponsors,
		IAPublicKey: iaPublicKey,
	}

	if err := pm.pollRepo.CreatePoll(dbPoll); err != nil {
		return nil, fmt.Errorf("failed to create poll in database: %w", err)
	}

	// Create in-memory poll for API response
	poll := &Poll{
		ID:          pollID,
		Title:       title,
		Description: description,
		Options:     options,
		CreatedAt:   time.Now(),
		StartTime:   startTime,
		EndTime:     endTime,
		Status:      "draft",
		Sponsors:    sponsors,
		PublicKey:   iaPublicKey,
	}

	// Initialize Merkle tree
	pm.merkleTrees[pollID] = merkle.NewMerkleTree()

	return poll, nil
}

// GetPoll retrieves a poll by ID
func (pm *PollManager) GetPoll(pollID string) (*Poll, error) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	dbPoll, err := pm.pollRepo.GetPoll(pollID)
	if err != nil {
		return nil, fmt.Errorf("failed to get poll from database: %w", err)
	}

	if dbPoll == nil {
		return nil, fmt.Errorf("poll not found: %s", pollID)
	}

	// Convert database poll to API poll
	poll := &Poll{
		ID:          dbPoll.PollID,
		Title:       dbPoll.Title,
		Description: dbPoll.Description,
		Options:     dbPoll.Options,
		CreatedAt:   dbPoll.CreatedAt,
		StartTime:   dbPoll.StartTime,
		EndTime:     dbPoll.EndTime,
		Status:      dbPoll.Status,
		Sponsors:    dbPoll.Sponsors,
		PublicKey:   dbPoll.IAPublicKey,
	}

	return poll, nil
}

// ListPolls returns all polls
func (pm *PollManager) ListPolls() ([]*Poll, error) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	dbPolls, err := pm.pollRepo.ListPolls()
	if err != nil {
		return nil, fmt.Errorf("failed to list polls from database: %w", err)
	}

	polls := make([]*Poll, 0, len(dbPolls))
	for _, dbPoll := range dbPolls {
		poll := &Poll{
			ID:          dbPoll.PollID,
			Title:       dbPoll.Title,
			Description: dbPoll.Description,
			Options:     dbPoll.Options,
			CreatedAt:   dbPoll.CreatedAt,
			StartTime:   dbPoll.StartTime,
			EndTime:     dbPoll.EndTime,
			Status:      dbPoll.Status,
			Sponsors:    dbPoll.Sponsors,
			PublicKey:   dbPoll.IAPublicKey,
		}
		polls = append(polls, poll)
	}

	return polls, nil
}

// SubmitVote submits a vote for a poll
func (pm *PollManager) SubmitVote(pollID, token, tag string, choice int) (*Vote, error) {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	// Check if poll exists and is active
	dbPoll, err := pm.pollRepo.GetPoll(pollID)
	if err != nil {
		return nil, fmt.Errorf("failed to get poll: %w", err)
	}

	if dbPoll == nil {
		return nil, fmt.Errorf("poll not found: %s", pollID)
	}

	if dbPoll.Status != "active" {
		return nil, fmt.Errorf("poll is not active: %s", dbPoll.Status)
	}

	// Check if poll is within voting period
	now := time.Now()
	if now.Before(dbPoll.StartTime) || now.After(dbPoll.EndTime) {
		return nil, fmt.Errorf("poll is not open for voting")
	}

	// Check if choice is valid
	if choice < 0 || choice >= len(dbPoll.Options) {
		return nil, fmt.Errorf("invalid choice: %d", choice)
	}

	// Check for duplicate votes
	isDuplicate, err := pm.voteRepo.CheckDuplicateVote(pollID, tag)
	if err != nil {
		return nil, fmt.Errorf("failed to check for duplicate vote: %w", err)
	}

	if isDuplicate {
		return nil, fmt.Errorf("duplicate vote detected")
	}

	// Create vote
	vote := &Vote{
		PollID:  pollID,
		Token:   token,
		Tag:     tag,
		Choice:  choice,
		VotedAt: now,
	}

	// Generate Merkle leaf
	vote.MerkleLeaf = generateMerkleLeaf(vote)

	// Add vote to Merkle tree
	merkleTree := pm.merkleTrees[pollID]
	proof, err := merkleTree.AddLeaf(vote.MerkleLeaf)
	if err != nil {
		return nil, fmt.Errorf("failed to add vote to Merkle tree: %w", err)
	}

	// Convert proof to string array for JSON serialization
	vote.MerkleProof = make([]string, len(proof.Path))
	copy(vote.MerkleProof, proof.Path)

	// Store vote in database
	dbVote := &database.Vote{
		PollID:     pollID,
		Token:      token,
		Tag:        tag,
		Choice:     choice,
		MerkleLeaf: vote.MerkleLeaf,
		MerkleProof: vote.MerkleProof,
	}

	if err := pm.voteRepo.CreateVote(dbVote); err != nil {
		return nil, fmt.Errorf("failed to store vote in database: %w", err)
	}

	return vote, nil
}

// GetVotes returns all votes for a poll
func (pm *PollManager) GetVotes(pollID string) ([]*Vote, error) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	// Check if poll exists
	_, err := pm.pollRepo.GetPoll(pollID)
	if err != nil {
		return nil, fmt.Errorf("failed to get poll: %w", err)
	}

	// Get votes from database
	dbVotes, err := pm.voteRepo.GetVotesByPoll(pollID)
	if err != nil {
		return nil, fmt.Errorf("failed to get votes: %w", err)
	}

	// Convert database votes to API votes
	votes := make([]*Vote, len(dbVotes))
	for i, dbVote := range dbVotes {
		votes[i] = &Vote{
			PollID:     dbVote.PollID,
			Token:      dbVote.Token,
			Tag:        dbVote.Tag,
			Choice:     dbVote.Choice,
			VotedAt:    dbVote.VotedAt,
			MerkleLeaf: dbVote.MerkleLeaf,
			MerkleProof: dbVote.MerkleProof,
		}
	}

	return votes, nil
}

// GetTally returns the vote tally for a poll
func (pm *PollManager) GetTally(pollID string) (map[int]int, error) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	// Get poll to know the number of options
	dbPoll, err := pm.pollRepo.GetPoll(pollID)
	if err != nil {
		return nil, fmt.Errorf("failed to get poll: %w", err)
	}

	if dbPoll == nil {
		return nil, fmt.Errorf("poll not found: %s", pollID)
	}

	// Get votes from database
	dbVotes, err := pm.voteRepo.GetVotesByPoll(pollID)
	if err != nil {
		return nil, fmt.Errorf("failed to get votes: %w", err)
	}

	tally := make(map[int]int)
	for i := range dbPoll.Options {
		tally[i] = 0
	}

	for _, vote := range dbVotes {
		tally[vote.Choice]++
	}

	return tally, nil
}

// GetCommitmentLog returns the commitment log for a poll
func (pm *PollManager) GetCommitmentLog(pollID string) (map[string]interface{}, error) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	// Check if poll exists
	_, err := pm.pollRepo.GetPoll(pollID)
	if err != nil {
		return nil, fmt.Errorf("failed to get poll: %w", err)
	}

	merkleTree := pm.merkleTrees[pollID]
	return merkleTree.GetCommitmentLog(), nil
}

// VerifyVoteProof verifies a vote's Merkle proof
func (pm *PollManager) VerifyVoteProof(pollID, merkleLeaf string, merkleProof []string) (bool, error) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	// Check if poll exists
	_, err := pm.pollRepo.GetPoll(pollID)
	if err != nil {
		return false, fmt.Errorf("failed to get poll: %w", err)
	}

	merkleTree := pm.merkleTrees[pollID]
	
	// Create proof object
	proof := &merkle.MerkleProof{
		Leaf:      merkleLeaf,
		Path:      merkleProof,
		Root:      merkleTree.GetRoot(),
		LeafCount: merkleTree.GetLeafCount(),
	}

	return merkleTree.VerifyProof(proof), nil
}

// ActivatePoll activates a poll for voting
func (pm *PollManager) ActivatePoll(pollID string) error {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	// Check if poll exists and is in draft status
	dbPoll, err := pm.pollRepo.GetPoll(pollID)
	if err != nil {
		return fmt.Errorf("failed to get poll: %w", err)
	}

	if dbPoll == nil {
		return fmt.Errorf("poll not found: %s", pollID)
	}

	if dbPoll.Status != "draft" {
		return fmt.Errorf("poll cannot be activated: current status is %s", dbPoll.Status)
	}

	// Update poll status in database
	if err := pm.pollRepo.UpdatePollStatus(pollID, "active"); err != nil {
		return fmt.Errorf("failed to update poll status: %w", err)
	}

	return nil
}

// ClosePoll closes a poll
func (pm *PollManager) ClosePoll(pollID string) error {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	// Check if poll exists
	dbPoll, err := pm.pollRepo.GetPoll(pollID)
	if err != nil {
		return fmt.Errorf("failed to get poll: %w", err)
	}

	if dbPoll == nil {
		return fmt.Errorf("poll not found: %s", pollID)
	}

	// Update poll status in database
	if err := pm.pollRepo.UpdatePollStatus(pollID, "closed"); err != nil {
		return fmt.Errorf("failed to update poll status: %w", err)
	}

	return nil
}

// generatePollID generates a unique poll ID
func generatePollID(title string, timestamp time.Time) string {
	input := fmt.Sprintf("%s-%d", title, timestamp.UnixNano())
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:8]) // Use first 8 bytes for shorter ID
}

// generateMerkleLeaf generates a Merkle leaf for a vote
func generateMerkleLeaf(vote *Vote) string {
	data := fmt.Sprintf("%s:%s:%d:%d", vote.PollID, vote.Tag, vote.Choice, vote.VotedAt.Unix())
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}
