package models

import (
	"time"
	"encoding/json"
)

// TrustTier represents the user's verification level
type TrustTier string

const (
	Tier0 TrustTier = "T0" // Anonymous
	Tier1 TrustTier = "T1" // Verified Human
	Tier2 TrustTier = "T2" // Trusted Participant
	Tier3 TrustTier = "T3" // Validator
)

// ProfileVisibility controls what data is visible
type ProfileVisibility string

const (
	Anonymous   ProfileVisibility = "anonymous"
	Pseudonymous ProfileVisibility = "pseudonymous"
	Public      ProfileVisibility = "public"
)

// DataSharingLevel controls what data is shared
type DataSharingLevel string

const (
	Minimal     DataSharingLevel = "minimal"
	Demographic DataSharingLevel = "demographic"
	Full        DataSharingLevel = "full"
)

// User represents the core user entity
type User struct {
	ID                 int       `json:"id" db:"id"`
	StableID          string    `json:"stable_id" db:"stable_id"`
	PseudonymHash     *string   `json:"pseudonym_hash,omitempty" db:"pseudonym_hash"`
	TrustTier         TrustTier `json:"trust_tier" db:"trust_tier"`
	VerificationScore int       `json:"verification_score" db:"verification_score"`
	LastActivity      time.Time `json:"last_activity" db:"last_activity"`
	IsSuspicious      bool      `json:"is_suspicious" db:"is_suspicious"`
	IsActive          bool      `json:"is_active" db:"is_active"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}

// UserProfile represents optional user profile data
type UserProfile struct {
	ID                int               `json:"id" db:"id"`
	UserStableID      string            `json:"user_stable_id" db:"user_stable_id"`
	ProfileVisibility ProfileVisibility `json:"profile_visibility" db:"profile_visibility"`
	DataSharingLevel  DataSharingLevel  `json:"data_sharing_level" db:"data_sharing_level"`
	AgeRange          *string           `json:"age_range,omitempty" db:"age_range"`
	EducationLevel    *string           `json:"education_level,omitempty" db:"education_level"`
	IncomeBracket     *string           `json:"income_bracket,omitempty" db:"income_bracket"`
	RegionCode        *string           `json:"region_code,omitempty" db:"region_code"`
	InterestsEncrypted *string          `json:"interests_encrypted,omitempty" db:"interests_encrypted"`
	CreatedAt         time.Time         `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time         `json:"updated_at" db:"updated_at"`
}

// DeviceFingerprint for bot detection
type DeviceFingerprint struct {
	ID             int       `json:"id" db:"id"`
	UserStableID   string    `json:"user_stable_id" db:"user_stable_id"`
	FingerprintHash string   `json:"fingerprint_hash" db:"fingerprint_hash"`
	DeviceType     *string   `json:"device_type,omitempty" db:"device_type"`
	BrowserInfo    *string   `json:"browser_info,omitempty" db:"browser_info"`
	IPHash         *string   `json:"ip_hash,omitempty" db:"ip_hash"`
	FirstSeen      time.Time `json:"first_seen" db:"first_seen"`
	LastSeen       time.Time `json:"last_seen" db:"last_seen"`
	IsSuspicious   bool      `json:"is_suspicious" db:"is_suspicious"`
}

// VerificationChallenge for bot resistance
type VerificationChallenge struct {
	ID           int             `json:"id" db:"id"`
	UserStableID string          `json:"user_stable_id" db:"user_stable_id"`
	ChallengeType string         `json:"challenge_type" db:"challenge_type"`
	ChallengeData json.RawMessage `json:"challenge_data" db:"challenge_data"`
	Completed    bool            `json:"completed" db:"completed"`
	Score        int             `json:"score" db:"score"`
	CreatedAt    time.Time       `json:"created_at" db:"created_at"`
	CompletedAt  *time.Time      `json:"completed_at,omitempty" db:"completed_at"`
	ExpiresAt    time.Time       `json:"expires_at" db:"expires_at"`
}

// UserActivityLog for tracking (anonymized)
type UserActivityLog struct {
	ID           int             `json:"id" db:"id"`
	UserStableID string          `json:"user_stable_id" db:"user_stable_id"`
	ActivityType string          `json:"activity_type" db:"activity_type"`
	Metadata     json.RawMessage `json:"metadata,omitempty" db:"metadata"`
	IPHash       *string         `json:"ip_hash,omitempty" db:"ip_hash"`
	CreatedAt    time.Time       `json:"created_at" db:"created_at"`
}

// RateLimit for preventing abuse
type RateLimit struct {
	ID          int       `json:"id" db:"id"`
	Identifier  string    `json:"identifier" db:"identifier"`
	ActionType  string    `json:"action_type" db:"action_type"`
	Count       int       `json:"count" db:"count"`
	WindowStart time.Time `json:"window_start" db:"window_start"`
	IsBlocked   bool      `json:"is_blocked" db:"is_blocked"`
}

// SocialVerification for Tier 2+ verification
type SocialVerification struct {
	ID               int             `json:"id" db:"id"`
	UserStableID     string          `json:"user_stable_id" db:"user_stable_id"`
	VerificationType string          `json:"verification_type" db:"verification_type"`
	VerifierStableID *string         `json:"verifier_stable_id,omitempty" db:"verifier_stable_id"`
	VerificationData json.RawMessage `json:"verification_data,omitempty" db:"verification_data"`
	Verified         bool            `json:"verified" db:"verified"`
	CreatedAt        time.Time       `json:"created_at" db:"created_at"`
	VerifiedAt       *time.Time      `json:"verified_at,omitempty" db:"verified_at"`
}

// UserReputation for trust scoring
type UserReputation struct {
	ID                  int       `json:"id" db:"id"`
	UserStableID        string    `json:"user_stable_id" db:"user_stable_id"`
	ReputationScore     int       `json:"reputation_score" db:"reputation_score"`
	ConsistencyScore    int       `json:"consistency_score" db:"consistency_score"`
	CommunityTrustScore int       `json:"community_trust_score" db:"community_trust_score"`
	LastCalculated      time.Time `json:"last_calculated" db:"last_calculated"`
}

// DataDeletionRequest for GDPR compliance
type DataDeletionRequest struct {
	ID           int       `json:"id" db:"id"`
	UserStableID string    `json:"user_stable_id" db:"user_stable_id"`
	RequestType  string    `json:"request_type" db:"request_type"`
	DataTypes    []string  `json:"data_types" db:"data_types"`
	Status       string    `json:"status" db:"status"`
	RequestedAt  time.Time `json:"requested_at" db:"requested_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty" db:"completed_at"`
}

// PublicUserProfile represents what's visible to others
type PublicUserProfile struct {
	StableID          string            `json:"stable_id"`
	TrustTier         TrustTier         `json:"trust_tier"`
	VerificationScore int               `json:"verification_score"`
	ProfileVisibility ProfileVisibility `json:"profile_visibility"`
	DataSharingLevel  DataSharingLevel  `json:"data_sharing_level"`
	// Only include data based on sharing level
	Demographics      *Demographics     `json:"demographics,omitempty"`
	Reputation        *UserReputation   `json:"reputation,omitempty"`
}

// Demographics represents shared demographic data
type Demographics struct {
	AgeRange       *string `json:"age_range,omitempty"`
	EducationLevel *string `json:"education_level,omitempty"`
	IncomeBracket  *string `json:"income_bracket,omitempty"`
	RegionCode     *string `json:"region_code,omitempty"`
}

// CreateUserRequest for new user registration
type CreateUserRequest struct {
	StableID      string `json:"stable_id" validate:"required"`
	Pseudonym     string `json:"pseudonym,omitempty"`
	DeviceFingerprint *DeviceFingerprint `json:"device_fingerprint,omitempty"`
}

// UpdateProfileRequest for profile updates
type UpdateProfileRequest struct {
	ProfileVisibility *ProfileVisibility `json:"profile_visibility,omitempty"`
	DataSharingLevel  *DataSharingLevel  `json:"data_sharing_level,omitempty"`
	AgeRange          *string            `json:"age_range,omitempty"`
	EducationLevel    *string            `json:"education_level,omitempty"`
	IncomeBracket     *string            `json:"income_bracket,omitempty"`
	RegionCode        *string            `json:"region_code,omitempty"`
	Interests         *string            `json:"interests,omitempty"` // Will be encrypted
}

// VerificationRequest for tier upgrades
type VerificationRequest struct {
	ChallengeType string          `json:"challenge_type" validate:"required"`
	ChallengeData json.RawMessage `json:"challenge_data" validate:"required"`
}

// DataDeletionRequest for GDPR compliance
type DataDeletionRequestRequest struct {
	RequestType string   `json:"request_type" validate:"required"`
	DataTypes   []string `json:"data_types" validate:"required"`
}
