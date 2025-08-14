package database

import (
	"database/sql"
	"encoding/json"
	"time"
)

// Poll represents a poll in the system
type Poll struct {
	ID           int       `json:"id"`
	PollID       string    `json:"poll_id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Options      []string  `json:"options"`
	CreatedAt    time.Time `json:"created_at"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
	Status       string    `json:"status"`
	Sponsors     []string  `json:"sponsors"`
	IAPublicKey  string    `json:"ia_public_key"`
}

// Vote represents a vote in the system
type Vote struct {
	ID         int       `json:"id"`
	PollID     string    `json:"poll_id"`
	Token      string    `json:"token"`
	Tag        string    `json:"tag"`
	Choice     int       `json:"choice"`
	VotedAt    time.Time `json:"voted_at"`
	MerkleLeaf string    `json:"merkle_leaf"`
	MerkleProof []string `json:"merkle_proof"`
}

// MerkleTree represents a Merkle tree state
type MerkleTree struct {
	ID        int       `json:"id"`
	PollID    string    `json:"poll_id"`
	Root      string    `json:"root"`
	LeafCount int       `json:"leaf_count"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// PollRepository handles poll database operations
type PollRepository struct {
	db *Database
}

// NewPollRepository creates a new poll repository
func NewPollRepository(db *Database) *PollRepository {
	return &PollRepository{db: db}
}

// CreatePoll creates a new poll
func (r *PollRepository) CreatePoll(poll *Poll) error {
	optionsJSON, err := json.Marshal(poll.Options)
	if err != nil {
		return err
	}

	sponsorsJSON, err := json.Marshal(poll.Sponsors)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO polls (poll_id, title, description, options, start_time, end_time, status, sponsors, ia_public_key)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	
	result, err := r.db.Exec(query, 
		poll.PollID, 
		poll.Title, 
		poll.Description, 
		string(optionsJSON), 
		poll.StartTime, 
		poll.EndTime, 
		poll.Status, 
		string(sponsorsJSON), 
		poll.IAPublicKey,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	poll.ID = int(id)
	return nil
}

// GetPoll retrieves a poll by ID
func (r *PollRepository) GetPoll(pollID string) (*Poll, error) {
	query := `
		SELECT id, poll_id, title, description, options, created_at, start_time, end_time, status, sponsors, ia_public_key
		FROM polls
		WHERE poll_id = ?
	`
	
	poll := &Poll{}
	var optionsJSON, sponsorsJSON string
	
	err := r.db.QueryRow(query, pollID).Scan(
		&poll.ID,
		&poll.PollID,
		&poll.Title,
		&poll.Description,
		&optionsJSON,
		&poll.CreatedAt,
		&poll.StartTime,
		&poll.EndTime,
		&poll.Status,
		&sponsorsJSON,
		&poll.IAPublicKey,
	)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	if err != nil {
		return nil, err
	}

	// Parse JSON arrays
	if err := json.Unmarshal([]byte(optionsJSON), &poll.Options); err != nil {
		return nil, err
	}
	
	if err := json.Unmarshal([]byte(sponsorsJSON), &poll.Sponsors); err != nil {
		return nil, err
	}
	
	return poll, nil
}

// ListPolls returns all polls
func (r *PollRepository) ListPolls() ([]*Poll, error) {
	query := `
		SELECT id, poll_id, title, description, options, created_at, start_time, end_time, status, sponsors, ia_public_key
		FROM polls
		ORDER BY created_at DESC
	`
	
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var polls []*Poll
	for rows.Next() {
		poll := &Poll{}
		var optionsJSON, sponsorsJSON string
		
		err := rows.Scan(
			&poll.ID,
			&poll.PollID,
			&poll.Title,
			&poll.Description,
			&optionsJSON,
			&poll.CreatedAt,
			&poll.StartTime,
			&poll.EndTime,
			&poll.Status,
			&sponsorsJSON,
			&poll.IAPublicKey,
		)
		if err != nil {
			return nil, err
		}

		// Parse JSON arrays
		if err := json.Unmarshal([]byte(optionsJSON), &poll.Options); err != nil {
			return nil, err
		}
		
		if err := json.Unmarshal([]byte(sponsorsJSON), &poll.Sponsors); err != nil {
			return nil, err
		}
		
		polls = append(polls, poll)
	}

	return polls, nil
}

// UpdatePollStatus updates a poll's status
func (r *PollRepository) UpdatePollStatus(pollID, status string) error {
	query := `UPDATE polls SET status = ? WHERE poll_id = ?`
	_, err := r.db.Exec(query, status, pollID)
	return err
}

// VoteRepository handles vote database operations
type VoteRepository struct {
	db *Database
}

// NewVoteRepository creates a new vote repository
func NewVoteRepository(db *Database) *VoteRepository {
	return &VoteRepository{db: db}
}

// CreateVote creates a new vote
func (r *VoteRepository) CreateVote(vote *Vote) error {
	proofJSON, err := json.Marshal(vote.MerkleProof)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO votes (poll_id, token, tag, choice, merkle_leaf, merkle_proof)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	
	result, err := r.db.Exec(query, 
		vote.PollID, 
		vote.Token, 
		vote.Tag, 
		vote.Choice, 
		vote.MerkleLeaf, 
		string(proofJSON),
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	vote.ID = int(id)
	return nil
}

// GetVotesByPoll retrieves all votes for a poll
func (r *VoteRepository) GetVotesByPoll(pollID string) ([]*Vote, error) {
	query := `
		SELECT id, poll_id, token, tag, choice, voted_at, merkle_leaf, merkle_proof
		FROM votes
		WHERE poll_id = ?
		ORDER BY voted_at ASC
	`
	
	rows, err := r.db.Query(query, pollID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var votes []*Vote
	for rows.Next() {
		vote := &Vote{}
		var proofJSON string
		
		err := rows.Scan(
			&vote.ID,
			&vote.PollID,
			&vote.Token,
			&vote.Tag,
			&vote.Choice,
			&vote.VotedAt,
			&vote.MerkleLeaf,
			&proofJSON,
		)
		if err != nil {
			return nil, err
		}

		// Parse JSON array
		if err := json.Unmarshal([]byte(proofJSON), &vote.MerkleProof); err != nil {
			return nil, err
		}
		
		votes = append(votes, vote)
	}

	return votes, nil
}

// CheckDuplicateVote checks if a vote with the same tag already exists
func (r *VoteRepository) CheckDuplicateVote(pollID, tag string) (bool, error) {
	query := `SELECT COUNT(*) FROM votes WHERE poll_id = ? AND tag = ?`
	
	var count int
	err := r.db.QueryRow(query, pollID, tag).Scan(&count)
	if err != nil {
		return false, err
	}
	
	return count > 0, nil
}

// MerkleTreeRepository handles Merkle tree database operations
type MerkleTreeRepository struct {
	db *Database
}

// NewMerkleTreeRepository creates a new Merkle tree repository
func NewMerkleTreeRepository(db *Database) *MerkleTreeRepository {
	return &MerkleTreeRepository{db: db}
}

// CreateMerkleTree creates a new Merkle tree
func (r *MerkleTreeRepository) CreateMerkleTree(merkleTree *MerkleTree) error {
	query := `
		INSERT INTO merkle_trees (poll_id, root, leaf_count)
		VALUES (?, ?, ?)
	`
	
	result, err := r.db.Exec(query, merkleTree.PollID, merkleTree.Root, merkleTree.LeafCount)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	merkleTree.ID = int(id)
	return nil
}

// UpdateMerkleTree updates a Merkle tree
func (r *MerkleTreeRepository) UpdateMerkleTree(pollID, root string, leafCount int) error {
	query := `
		UPDATE merkle_trees 
		SET root = ?, leaf_count = ?, updated_at = CURRENT_TIMESTAMP
		WHERE poll_id = ?
	`
	_, err := r.db.Exec(query, root, leafCount, pollID)
	return err
}

// GetMerkleTree retrieves a Merkle tree by poll ID
func (r *MerkleTreeRepository) GetMerkleTree(pollID string) (*MerkleTree, error) {
	query := `
		SELECT id, poll_id, root, leaf_count, created_at, updated_at
		FROM merkle_trees
		WHERE poll_id = ?
	`
	
	merkleTree := &MerkleTree{}
	err := r.db.QueryRow(query, pollID).Scan(
		&merkleTree.ID,
		&merkleTree.PollID,
		&merkleTree.Root,
		&merkleTree.LeafCount,
		&merkleTree.CreatedAt,
		&merkleTree.UpdatedAt,
	)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	return merkleTree, err
}
