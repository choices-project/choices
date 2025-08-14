package poll

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

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
	polls      map[string]*Poll
	votes      map[string][]*Vote // pollID -> votes
	merkleTrees map[string]*merkle.MerkleTree // pollID -> Merkle tree
	mutex      sync.RWMutex
}

// NewPollManager creates a new poll manager
func NewPollManager() *PollManager {
	return &PollManager{
		polls:       make(map[string]*Poll),
		votes:       make(map[string][]*Vote),
		merkleTrees: make(map[string]*merkle.MerkleTree),
	}
}

// CreatePoll creates a new poll
func (pm *PollManager) CreatePoll(title, description string, options []string, startTime, endTime time.Time, sponsors []string, iaPublicKey string) (*Poll, error) {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	// Generate poll ID
	pollID := generatePollID(title, time.Now())

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

	pm.polls[pollID] = poll
	pm.votes[pollID] = make([]*Vote, 0)
	pm.merkleTrees[pollID] = merkle.NewMerkleTree()

	return poll, nil
}

// GetPoll retrieves a poll by ID
func (pm *PollManager) GetPoll(pollID string) (*Poll, error) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	poll, exists := pm.polls[pollID]
	if !exists {
		return nil, fmt.Errorf("poll not found: %s", pollID)
	}

	return poll, nil
}

// ListPolls returns all polls
func (pm *PollManager) ListPolls() []*Poll {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	polls := make([]*Poll, 0, len(pm.polls))
	for _, poll := range pm.polls {
		polls = append(polls, poll)
	}

	return polls
}

// SubmitVote submits a vote for a poll
func (pm *PollManager) SubmitVote(pollID, token, tag string, choice int) (*Vote, error) {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	// Check if poll exists and is active
	poll, exists := pm.polls[pollID]
	if !exists {
		return nil, fmt.Errorf("poll not found: %s", pollID)
	}

	if poll.Status != "active" {
		return nil, fmt.Errorf("poll is not active: %s", poll.Status)
	}

	// Check if poll is within voting period
	now := time.Now()
	if now.Before(poll.StartTime) || now.After(poll.EndTime) {
		return nil, fmt.Errorf("poll is not open for voting")
	}

	// Check if choice is valid
	if choice < 0 || choice >= len(poll.Options) {
		return nil, fmt.Errorf("invalid choice: %d", choice)
	}

	// Check for duplicate votes (using tag as unique identifier)
	votes := pm.votes[pollID]
	for _, vote := range votes {
		if vote.Tag == tag {
			return nil, fmt.Errorf("duplicate vote detected")
		}
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

	// Add vote to poll
	pm.votes[pollID] = append(pm.votes[pollID], vote)

	return vote, nil
}

// GetVotes returns all votes for a poll
func (pm *PollManager) GetVotes(pollID string) ([]*Vote, error) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	_, exists := pm.polls[pollID]
	if !exists {
		return nil, fmt.Errorf("poll not found: %s", pollID)
	}

	votes := make([]*Vote, len(pm.votes[pollID]))
	copy(votes, pm.votes[pollID])

	return votes, nil
}

// GetTally returns the vote tally for a poll
func (pm *PollManager) GetTally(pollID string) (map[int]int, error) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	poll, exists := pm.polls[pollID]
	if !exists {
		return nil, fmt.Errorf("poll not found: %s", pollID)
	}

	tally := make(map[int]int)
	for i := range poll.Options {
		tally[i] = 0
	}

	for _, vote := range pm.votes[pollID] {
		tally[vote.Choice]++
	}

	return tally, nil
}

// GetCommitmentLog returns the commitment log for a poll
func (pm *PollManager) GetCommitmentLog(pollID string) (map[string]interface{}, error) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	_, exists := pm.polls[pollID]
	if !exists {
		return nil, fmt.Errorf("poll not found: %s", pollID)
	}

	merkleTree := pm.merkleTrees[pollID]
	return merkleTree.GetCommitmentLog(), nil
}

// VerifyVoteProof verifies a vote's Merkle proof
func (pm *PollManager) VerifyVoteProof(pollID, merkleLeaf string, merkleProof []string) (bool, error) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	_, exists := pm.polls[pollID]
	if !exists {
		return false, fmt.Errorf("poll not found: %s", pollID)
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

	poll, exists := pm.polls[pollID]
	if !exists {
		return fmt.Errorf("poll not found: %s", pollID)
	}

	if poll.Status != "draft" {
		return fmt.Errorf("poll cannot be activated: current status is %s", poll.Status)
	}

	poll.Status = "active"
	return nil
}

// ClosePoll closes a poll
func (pm *PollManager) ClosePoll(pollID string) error {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	poll, exists := pm.polls[pollID]
	if !exists {
		return fmt.Errorf("poll not found: %s", pollID)
	}

	poll.Status = "closed"
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
