package services

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"time"

	"choice/profile/internal/models"
)

// BotResistanceService handles bot detection and verification challenges
type BotResistanceService struct {
	privacyService *PrivacyService
}

// NewBotResistanceService creates a new bot resistance service
func NewBotResistanceService(privacyService *PrivacyService) *BotResistanceService {
	return &BotResistanceService{
		privacyService: privacyService,
	}
}

// ChallengeType represents different types of verification challenges
type ChallengeType string

const (
	CaptchaChallenge    ChallengeType = "captcha"
	BehaviorChallenge   ChallengeType = "behavior"
	SocialChallenge     ChallengeType = "social"
	ConsistencyChallenge ChallengeType = "consistency"
)

// CreateCaptchaChallenge creates a CAPTCHA challenge
func (brs *BotResistanceService) CreateCaptchaChallenge(userID string) (*models.VerificationChallenge, error) {
	// Generate a simple math CAPTCHA
	challenge := brs.generateMathCaptcha()
	
	challengeData, err := json.Marshal(challenge)
	if err != nil {
		return nil, err
	}
	
	return &models.VerificationChallenge{
		UserStableID:   userID,
		ChallengeType:  string(CaptchaChallenge),
		ChallengeData:  challengeData,
		Completed:      false,
		Score:          0,
		CreatedAt:      time.Now(),
		ExpiresAt:      time.Now().Add(10 * time.Minute), // 10 minute expiry
	}, nil
}

// CreateBehaviorChallenge creates a behavior-based challenge
func (brs *BotResistanceService) CreateBehaviorChallenge(userID string) (*models.VerificationChallenge, error) {
	// Generate a behavior challenge (mouse movement, timing, etc.)
	challenge := brs.generateBehaviorChallenge()
	
	challengeData, err := json.Marshal(challenge)
	if err != nil {
		return nil, err
	}
	
	return &models.VerificationChallenge{
		UserStableID:   userID,
		ChallengeType:  string(BehaviorChallenge),
		ChallengeData:  challengeData,
		Completed:      false,
		Score:          0,
		CreatedAt:      time.Now(),
		ExpiresAt:      time.Now().Add(5 * time.Minute), // 5 minute expiry
	}, nil
}

// CreateSocialChallenge creates a social verification challenge
func (brs *BotResistanceService) CreateSocialChallenge(userID string, verifierID string) (*models.VerificationChallenge, error) {
	// Generate a social challenge (invite, endorsement, etc.)
	challenge := brs.generateSocialChallenge(verifierID)
	
	challengeData, err := json.Marshal(challenge)
	if err != nil {
		return nil, err
	}
	
	return &models.VerificationChallenge{
		UserStableID:   userID,
		ChallengeType:  string(SocialChallenge),
		ChallengeData:  challengeData,
		Completed:      false,
		Score:          0,
		CreatedAt:      time.Now(),
		ExpiresAt:      time.Now().Add(24 * time.Hour), // 24 hour expiry
	}, nil
}

// VerifyCaptchaChallenge verifies a CAPTCHA challenge
func (brs *BotResistanceService) VerifyCaptchaChallenge(challenge *models.VerificationChallenge, userAnswer string) (bool, int, error) {
	var challengeData map[string]interface{}
	if err := json.Unmarshal(challenge.ChallengeData, &challengeData); err != nil {
		return false, 0, err
	}
	
	expectedAnswer, ok := challengeData["answer"].(string)
	if !ok {
		return false, 0, fmt.Errorf("invalid challenge data")
	}
	
	correct := strings.TrimSpace(strings.ToLower(userAnswer)) == strings.TrimSpace(strings.ToLower(expectedAnswer))
	score := 0
	
	if correct {
		score = 10
		challenge.Completed = true
		now := time.Now()
		challenge.CompletedAt = &now
	}
	
	return correct, score, nil
}

// VerifyBehaviorChallenge verifies a behavior challenge
func (brs *BotResistanceService) VerifyBehaviorChallenge(challenge *models.VerificationChallenge, behaviorData map[string]interface{}) (bool, int, error) {
	var challengeData map[string]interface{}
	if err := json.Unmarshal(challenge.ChallengeData, &challengeData); err != nil {
		return false, 0, err
	}
	
	// Analyze behavior patterns
	score := brs.analyzeBehavior(behaviorData)
	
	// Consider it passed if score is above threshold
	passed := score >= 7
	if passed {
		challenge.Completed = true
		now := time.Now()
		challenge.CompletedAt = &now
	}
	
	return passed, score, nil
}

// DetectSuspiciousActivity analyzes user behavior for suspicious patterns
func (brs *BotResistanceService) DetectSuspiciousActivity(userID string, activityLogs []*models.UserActivityLog) (bool, float64, error) {
	if len(activityLogs) < 5 {
		return false, 0.0, nil // Not enough data
	}
	
	suspicionScore := 0.0
	
	// Check for rapid activity
	rapidActivity := brs.checkRapidActivity(activityLogs)
	if rapidActivity {
		suspicionScore += 0.3
	}
	
	// Check for repetitive patterns
	repetitivePatterns := brs.checkRepetitivePatterns(activityLogs)
	if repetitivePatterns {
		suspicionScore += 0.4
	}
	
	// Check for unusual timing
	unusualTiming := brs.checkUnusualTiming(activityLogs)
	if unusualTiming {
		suspicionScore += 0.3
	}
	
	// Check for device fingerprint anomalies
	deviceAnomalies := brs.checkDeviceAnomalies(activityLogs)
	if deviceAnomalies {
		suspicionScore += 0.2
	}
	
	return suspicionScore > 0.5, suspicionScore, nil
}

// CalculateTrustScore calculates a user's trust score based on various factors
func (brs *BotResistanceService) CalculateTrustScore(user *models.User, challenges []*models.VerificationChallenge, socialVerifications []*models.SocialVerification) int {
	score := 0
	
	// Base score from verification challenges
	for _, challenge := range challenges {
		if challenge.Completed {
			score += challenge.Score
		}
	}
	
	// Social verification bonus
	for _, verification := range socialVerifications {
		if verification.Verified {
			score += 20
		}
	}
	
	// Time-based bonus (longer active users get bonus)
	daysActive := int(time.Since(user.CreatedAt).Hours() / 24)
	if daysActive > 30 {
		score += 10
	}
	if daysActive > 90 {
		score += 10
	}
	
	// Cap at 100
	if score > 100 {
		score = 100
	}
	
	return score
}

// Helper methods

func (brs *BotResistanceService) generateMathCaptcha() map[string]interface{} {
	// Generate simple math problem
	operations := []string{"+", "-", "*"}
	op := operations[brs.randomInt(0, len(operations)-1)]
	
	var a, b, answer int
	switch op {
	case "+":
		a = brs.randomInt(1, 50)
		b = brs.randomInt(1, 50)
		answer = a + b
	case "-":
		a = brs.randomInt(10, 100)
		b = brs.randomInt(1, a-1)
		answer = a - b
	case "*":
		a = brs.randomInt(2, 12)
		b = brs.randomInt(2, 12)
		answer = a * b
	}
	
	return map[string]interface{}{
		"question": fmt.Sprintf("%d %s %d = ?", a, op, b),
		"answer":   fmt.Sprintf("%d", answer),
		"type":     "math",
	}
}

func (brs *BotResistanceService) generateBehaviorChallenge() map[string]interface{} {
	// Generate behavior challenge instructions
	challenges := []string{
		"Move your mouse in a circle",
		"Click and drag to draw a square",
		"Type the word 'human' slowly",
		"Wait 3 seconds before clicking",
	}
	
	challenge := challenges[brs.randomInt(0, len(challenges)-1)]
	
	return map[string]interface{}{
		"instruction": challenge,
		"type":        "behavior",
		"expected_duration": brs.randomInt(3, 10), // seconds
	}
}

func (brs *BotResistanceService) generateSocialChallenge(verifierID string) map[string]interface{} {
	return map[string]interface{}{
		"verifier_id": verifierID,
		"type":        "social",
		"action":      "endorsement",
		"message":     "Please endorse this user as a real person",
	}
}

func (brs *BotResistanceService) analyzeBehavior(behaviorData map[string]interface{}) int {
	score := 0
	
	// Check mouse movement patterns
	if mouseData, ok := behaviorData["mouse_movement"].(map[string]interface{}); ok {
		if brs.isHumanMouseMovement(mouseData) {
			score += 3
		}
	}
	
	// Check timing patterns
	if timingData, ok := behaviorData["timing"].(map[string]interface{}); ok {
		if brs.isHumanTiming(timingData) {
			score += 3
		}
	}
	
	// Check keyboard patterns
	if keyboardData, ok := behaviorData["keyboard"].(map[string]interface{}); ok {
		if brs.isHumanKeyboardPattern(keyboardData) {
			score += 4
		}
	}
	
	return score
}

func (brs *BotResistanceService) checkRapidActivity(logs []*models.UserActivityLog) bool {
	if len(logs) < 2 {
		return false
	}
	
	// Check for multiple activities within 1 second
	for i := 1; i < len(logs); i++ {
		timeDiff := logs[i].CreatedAt.Sub(logs[i-1].CreatedAt)
		if timeDiff < time.Second {
			return true
		}
	}
	
	return false
}

func (brs *BotResistanceService) checkRepetitivePatterns(logs []*models.UserActivityLog) bool {
	if len(logs) < 10 {
		return false
	}
	
	// Check for exact same activity type repeated many times
	activityCounts := make(map[string]int)
	for _, log := range logs {
		activityCounts[log.ActivityType]++
	}
	
	for _, count := range activityCounts {
		if count > len(logs)/2 {
			return true
		}
	}
	
	return false
}

func (brs *BotResistanceService) checkUnusualTiming(logs []*models.UserActivityLog) bool {
	if len(logs) < 5 {
		return false
	}
	
	// Check for activity at unusual hours (2 AM - 6 AM)
	unusualHourCount := 0
	for _, log := range logs {
		hour := log.CreatedAt.Hour()
		if hour >= 2 && hour <= 6 {
			unusualHourCount++
		}
	}
	
	// If more than 30% of activities are at unusual hours, flag as suspicious
	return float64(unusualHourCount)/float64(len(logs)) > 0.3
}

func (brs *BotResistanceService) checkDeviceAnomalies(logs []*models.UserActivityLog) bool {
	// This would check for multiple devices, unusual device types, etc.
	// Simplified implementation
	return false
}

func (brs *BotResistanceService) isHumanMouseMovement(mouseData map[string]interface{}) bool {
	// Check for natural mouse movement patterns
	// Simplified implementation
	return true
}

func (brs *BotResistanceService) isHumanTiming(timingData map[string]interface{}) bool {
	// Check for human-like timing patterns
	// Simplified implementation
	return true
}

func (brs *BotResistanceService) isHumanKeyboardPattern(keyboardData map[string]interface{}) bool {
	// Check for human-like keyboard patterns
	// Simplified implementation
	return true
}

func (brs *BotResistanceService) randomInt(min, max int) int {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	value := int(bytes[0])<<24 | int(bytes[1])<<16 | int(bytes[2])<<8 | int(bytes[3])
	return min + int(math.Abs(float64(value)))%(max-min+1)
}
