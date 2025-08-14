package database

import (
	"database/sql"
	"time"
)

// User represents a user in the system
type User struct {
	ID              int       `json:"id"`
	StableID        string    `json:"stable_id"`
	Email           string    `json:"email"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	VerificationTier string   `json:"verification_tier"`
	IsActive        bool      `json:"is_active"`
}

// Token represents an issued token
type Token struct {
	ID           int       `json:"id"`
	UserStableID string    `json:"user_stable_id"`
	PollID       string    `json:"poll_id"`
	TokenHash    string    `json:"token_hash"`
	Tag          string    `json:"tag"`
	Tier         string    `json:"tier"`
	Scope        string    `json:"scope"`
	IssuedAt     time.Time `json:"issued_at"`
	ExpiresAt    time.Time `json:"expires_at"`
	IsRevoked    bool      `json:"is_revoked"`
}

// VerificationSession represents a WebAuthn verification session
type VerificationSession struct {
	ID           int       `json:"id"`
	UserStableID string    `json:"user_stable_id"`
	SessionID    string    `json:"session_id"`
	Challenge    string    `json:"challenge"`
	CreatedAt    time.Time `json:"created_at"`
	ExpiresAt    time.Time `json:"expires_at"`
	IsUsed       bool      `json:"is_used"`
}

// WebAuthnCredential represents a WebAuthn credential
type WebAuthnCredential struct {
	ID           int       `json:"id"`
	UserStableID string    `json:"user_stable_id"`
	CredentialID string    `json:"credential_id"`
	PublicKey    string    `json:"public_key"`
	SignCount    int       `json:"sign_count"`
	CreatedAt    time.Time `json:"created_at"`
	LastUsedAt   *time.Time `json:"last_used_at"`
	IsActive     bool      `json:"is_active"`
}

// UserRepository handles user database operations
type UserRepository struct {
	db *Database
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *Database) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser creates a new user
func (r *UserRepository) CreateUser(user *User) error {
	query := `
		INSERT INTO users (stable_id, email, verification_tier, is_active)
		VALUES (?, ?, ?, ?)
	`
	
	// Handle empty email by using NULL instead of empty string
	var email interface{}
	if user.Email == "" {
		email = nil
	} else {
		email = user.Email
	}
	
	log.Printf("Creating user with stable_id: %s, email: %v, tier: %s", user.StableID, email, user.VerificationTier)
	
	result, err := r.db.Exec(query, user.StableID, email, user.VerificationTier, user.IsActive)
	if err != nil {
		log.Printf("Database error: %v", err)
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	user.ID = int(id)
	return nil
}

// GetUserByStableID retrieves a user by stable ID
func (r *UserRepository) GetUserByStableID(stableID string) (*User, error) {
	query := `
		SELECT id, stable_id, email, created_at, updated_at, verification_tier, is_active
		FROM users
		WHERE stable_id = ?
	`
	
	user := &User{}
	err := r.db.QueryRow(query, stableID).Scan(
		&user.ID,
		&user.StableID,
		&user.Email,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.VerificationTier,
		&user.IsActive,
	)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	return user, err
}

// UpdateUser updates a user
func (r *UserRepository) UpdateUser(user *User) error {
	query := `
		UPDATE users
		SET email = ?, verification_tier = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
		WHERE stable_id = ?
	`
	
	_, err := r.db.Exec(query, user.Email, user.VerificationTier, user.IsActive, user.StableID)
	return err
}

// TokenRepository handles token database operations
type TokenRepository struct {
	db *Database
}

// NewTokenRepository creates a new token repository
func NewTokenRepository(db *Database) *TokenRepository {
	return &TokenRepository{db: db}
}

// CreateToken creates a new token
func (r *TokenRepository) CreateToken(token *Token) error {
	query := `
		INSERT INTO tokens (user_stable_id, poll_id, token_hash, tag, tier, scope, expires_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	
	result, err := r.db.Exec(query, 
		token.UserStableID, 
		token.PollID, 
		token.TokenHash, 
		token.Tag, 
		token.Tier, 
		token.Scope, 
		token.ExpiresAt,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	token.ID = int(id)
	return nil
}

// GetTokenByHash retrieves a token by hash
func (r *TokenRepository) GetTokenByHash(tokenHash string) (*Token, error) {
	query := `
		SELECT id, user_stable_id, poll_id, token_hash, tag, tier, scope, issued_at, expires_at, is_revoked
		FROM tokens
		WHERE token_hash = ?
	`
	
	token := &Token{}
	err := r.db.QueryRow(query, tokenHash).Scan(
		&token.ID,
		&token.UserStableID,
		&token.PollID,
		&token.TokenHash,
		&token.Tag,
		&token.Tier,
		&token.Scope,
		&token.IssuedAt,
		&token.ExpiresAt,
		&token.IsRevoked,
	)
	
	if err == sql.ErrNoRows {
		return nil, nil
	}
	
	return token, err
}

// GetTokensByUserAndPoll retrieves tokens for a user and poll
func (r *TokenRepository) GetTokensByUserAndPoll(userStableID, pollID string) ([]*Token, error) {
	query := `
		SELECT id, user_stable_id, poll_id, token_hash, tag, tier, scope, issued_at, expires_at, is_revoked
		FROM tokens
		WHERE user_stable_id = ? AND poll_id = ? AND is_revoked = 0
		ORDER BY issued_at DESC
	`
	
	rows, err := r.db.Query(query, userStableID, pollID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tokens []*Token
	for rows.Next() {
		token := &Token{}
		err := rows.Scan(
			&token.ID,
			&token.UserStableID,
			&token.PollID,
			&token.TokenHash,
			&token.Tag,
			&token.Tier,
			&token.Scope,
			&token.IssuedAt,
			&token.ExpiresAt,
			&token.IsRevoked,
		)
		if err != nil {
			return nil, err
		}
		tokens = append(tokens, token)
	}

	return tokens, nil
}

// RevokeToken revokes a token
func (r *TokenRepository) RevokeToken(tokenHash string) error {
	query := `UPDATE tokens SET is_revoked = 1 WHERE token_hash = ?`
	_, err := r.db.Exec(query, tokenHash)
	return err
}

// CleanupExpiredTokens removes expired tokens
func (r *TokenRepository) CleanupExpiredTokens() error {
	query := `DELETE FROM tokens WHERE expires_at < CURRENT_TIMESTAMP`
	_, err := r.db.Exec(query)
	return err
}
