package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"choice/profile/internal/models"
)

// PrivacyService handles data anonymization and privacy controls
type PrivacyService struct {
	encryptionKey []byte
}

// NewPrivacyService creates a new privacy service
func NewPrivacyService(encryptionKey []byte) *PrivacyService {
	return &PrivacyService{
		encryptionKey: encryptionKey,
	}
}

// HashPseudonym creates a hash of the user's pseudonym
func (ps *PrivacyService) HashPseudonym(pseudonym string, salt string) string {
	hash := sha256.Sum256([]byte(pseudonym + salt))
	return hex.EncodeToString(hash[:])
}

// GenerateSalt creates a random salt for hashing
func (ps *PrivacyService) GenerateSalt() (string, error) {
	salt := make([]byte, 32)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	return hex.EncodeToString(salt), nil
}

// HashIP creates a hash of the IP address for rate limiting
func (ps *PrivacyService) HashIP(ip string) string {
	// Remove port if present
	ip = strings.Split(ip, ":")[0]
	hash := sha256.Sum256([]byte(ip))
	return hex.EncodeToString(hash[:])
}

// AnonymizeLocation converts exact location to broad region
func (ps *PrivacyService) AnonymizeLocation(location string) string {
	// This is a simplified version - in production you'd use a geocoding service
	// to convert coordinates to broad regions
	location = strings.ToLower(location)
	
	// Simple region mapping
	regions := map[string]string{
		"north america": "NA",
		"europe": "EU",
		"asia": "AS",
		"africa": "AF",
		"south america": "SA",
		"australia": "AU",
	}
	
	for region, code := range regions {
		if strings.Contains(location, region) {
			return code
		}
	}
	
	return "UN" // Unknown
}

// AnonymizeAge converts exact age to age range
func (ps *PrivacyService) AnonymizeAge(age int) string {
	switch {
	case age >= 18 && age <= 24:
		return "18-24"
	case age >= 25 && age <= 34:
		return "25-34"
	case age >= 35 && age <= 44:
		return "35-44"
	case age >= 45 && age <= 54:
		return "45-54"
	case age >= 55 && age <= 64:
		return "55-64"
	case age >= 65:
		return "65+"
	default:
		return "unknown"
	}
}

// AnonymizeIncome converts exact income to bracket
func (ps *PrivacyService) AnonymizeIncome(income int) string {
	// Income brackets in USD (adjust for your region)
	switch {
	case income < 30000:
		return "low"
	case income >= 30000 && income < 60000:
		return "lower_middle"
	case income >= 60000 && income < 100000:
		return "middle"
	case income >= 100000 && income < 200000:
		return "upper_middle"
	case income >= 200000:
		return "high"
	default:
		return "unknown"
	}
}

// EncryptData encrypts sensitive data
func (ps *PrivacyService) EncryptData(data string) (string, error) {
	// In production, use a proper encryption library like age
	// This is a simplified version for demonstration
	if data == "" {
		return "", nil
	}
	
	// Simple XOR encryption (NOT for production!)
	encrypted := make([]byte, len(data))
	for i := 0; i < len(data); i++ {
		encrypted[i] = data[i] ^ ps.encryptionKey[i%len(ps.encryptionKey)]
	}
	
	return hex.EncodeToString(encrypted), nil
}

// DecryptData decrypts sensitive data
func (ps *PrivacyService) DecryptData(encryptedData string) (string, error) {
	if encryptedData == "" {
		return "", nil
	}
	
	// Decode hex
	data, err := hex.DecodeString(encryptedData)
	if err != nil {
		return "", err
	}
	
	// Simple XOR decryption (NOT for production!)
	decrypted := make([]byte, len(data))
	for i := 0; i < len(data); i++ {
		decrypted[i] = data[i] ^ ps.encryptionKey[i%len(ps.encryptionKey)]
	}
	
	return string(decrypted), nil
}

// AnonymizeUserData processes user data for privacy
func (ps *PrivacyService) AnonymizeUserData(data map[string]interface{}) map[string]interface{} {
	anonymized := make(map[string]interface{})
	
	for key, value := range data {
		switch key {
		case "age":
			if age, ok := value.(int); ok {
				anonymized["age_range"] = ps.AnonymizeAge(age)
			}
		case "location":
			if location, ok := value.(string); ok {
				anonymized["region"] = ps.AnonymizeLocation(location)
			}
		case "income":
			if income, ok := value.(int); ok {
				anonymized["income_bracket"] = ps.AnonymizeIncome(income)
			}
		case "email":
			// Don't include email in anonymized data
			continue
		case "phone":
			// Don't include phone in anonymized data
			continue
		default:
			// Include other data as-is if it's not personally identifiable
			anonymized[key] = value
		}
	}
	
	return anonymized
}

// CreatePublicProfile creates a public profile based on privacy settings
func (ps *PrivacyService) CreatePublicProfile(user *models.User, profile *models.UserProfile, reputation *models.UserReputation) *models.PublicUserProfile {
	public := &models.PublicUserProfile{
		StableID:          user.StableID,
		TrustTier:         user.TrustTier,
		VerificationScore: user.VerificationScore,
		ProfileVisibility: profile.ProfileVisibility,
		DataSharingLevel:  profile.DataSharingLevel,
	}
	
	// Only include demographics based on sharing level
	if profile.DataSharingLevel == models.Demographic || profile.DataSharingLevel == models.Full {
		public.Demographics = &models.Demographics{
			AgeRange:       profile.AgeRange,
			EducationLevel: profile.EducationLevel,
			IncomeBracket:  profile.IncomeBracket,
			RegionCode:     profile.RegionCode,
		}
	}
	
	// Only include reputation for public profiles
	if profile.ProfileVisibility == models.Public && reputation != nil {
		public.Reputation = reputation
	}
	
	return public
}

// ValidatePrivacySettings ensures privacy settings are valid
func (ps *PrivacyService) ValidatePrivacySettings(visibility models.ProfileVisibility, sharing models.DataSharingLevel) error {
	// Ensure data sharing level doesn't exceed visibility
	if visibility == models.Anonymous && sharing != models.Minimal {
		return fmt.Errorf("anonymous profiles can only have minimal data sharing")
	}
	
	if visibility == models.Pseudonymous && sharing == models.Full {
		return fmt.Errorf("pseudonymous profiles cannot have full data sharing")
	}
	
	return nil
}

// CreateActivityLog creates an anonymized activity log entry
func (ps *PrivacyService) CreateActivityLog(userID, activityType string, metadata map[string]interface{}, ipHash string) *models.UserActivityLog {
	// Anonymize metadata
	anonymizedMetadata := ps.AnonymizeUserData(metadata)
	
	// Convert to JSON
	metadataJSON, _ := json.Marshal(anonymizedMetadata)
	
	return &models.UserActivityLog{
		UserStableID: userID,
		ActivityType: activityType,
		Metadata:     metadataJSON,
		IPHash:       &ipHash,
		CreatedAt:    time.Now(),
	}
}

// CheckDataRetentionPolicy determines if data should be retained
func (ps *PrivacyService) CheckDataRetentionPolicy(createdAt time.Time, dataType string) bool {
	// Different retention periods for different data types
	retentionPeriods := map[string]time.Duration{
		"activity_log": 1 * 365 * 24 * time.Hour, // 1 year
		"device_fingerprint": 90 * 24 * time.Hour, // 90 days
		"verification_challenge": 30 * 24 * time.Hour, // 30 days
		"rate_limit": 24 * time.Hour, // 1 day
	}
	
	if period, exists := retentionPeriods[dataType]; exists {
		return time.Since(createdAt) < period
	}
	
	// Default: keep forever (for user profiles, etc.)
	return true
}
