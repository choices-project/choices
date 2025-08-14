package audit

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
)

// AuditLevel represents the severity level of an audit event
type AuditLevel string

const (
	AuditLevelInfo    AuditLevel = "INFO"
	AuditLevelWarning AuditLevel = "WARNING"
	AuditLevelError   AuditLevel = "ERROR"
	AuditLevelSecurity AuditLevel = "SECURITY"
)

// AuditEvent represents a single audit event
type AuditEvent struct {
	ID          string                 `json:"id"`
	Timestamp   time.Time              `json:"timestamp"`
	Level       AuditLevel             `json:"level"`
	Category    string                 `json:"category"`
	Action      string                 `json:"action"`
	UserID      string                 `json:"user_id"`
	UserTier    string                 `json:"user_tier"`
	IPAddress   string                 `json:"ip_address"`
	UserAgent   string                 `json:"user_agent"`
	Resource    string                 `json:"resource"`
	Details     map[string]interface{} `json:"details"`
	SessionID   string                 `json:"session_id"`
	RequestID   string                 `json:"request_id"`
	Success     bool                   `json:"success"`
	Error       string                 `json:"error,omitempty"`
}

// AuditLogger handles audit trail logging
type AuditLogger struct {
	events []*AuditEvent
	mutex  chan struct{} // Simple mutex using channel
}

// NewAuditLogger creates a new audit logger
func NewAuditLogger() *AuditLogger {
	return &AuditLogger{
		events: make([]*AuditEvent, 0),
		mutex:  make(chan struct{}, 1), // Buffer size 1 for mutex
	}
}

// LogEvent logs an audit event
func (al *AuditLogger) LogEvent(event *AuditEvent) {
	// Acquire mutex
	al.mutex <- struct{}{}
	defer func() { <-al.mutex }()

	// Add timestamp if not set
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	// Add to events slice
	al.events = append(al.events, event)

	// Log to standard logger
	al.logToStandardOutput(event)
}

// LogTokenIssuance logs token issuance events
func (al *AuditLogger) LogTokenIssuance(userID, userTier, pollID, ipAddress, userAgent string, success bool, error string) {
	event := &AuditEvent{
		Level:     AuditLevelInfo,
		Category:  "TOKEN_ISSUANCE",
		Action:    "ISSUE_TOKEN",
		UserID:    userID,
		UserTier:  userTier,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Resource:  fmt.Sprintf("poll:%s", pollID),
		Details: map[string]interface{}{
			"poll_id": pollID,
			"tier":    userTier,
		},
		Success: success,
		Error:   error,
	}
	al.LogEvent(event)
}

// LogWebAuthnEvent logs WebAuthn-related events
func (al *AuditLogger) LogWebAuthnEvent(action, userID, ipAddress, userAgent string, success bool, error string, details map[string]interface{}) {
	event := &AuditEvent{
		Level:     AuditLevelSecurity,
		Category:  "WEBAUTHN",
		Action:    action,
		UserID:    userID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details:   details,
		Success:   success,
		Error:     error,
	}
	al.LogEvent(event)
}

// LogSecurityEvent logs security-related events
func (al *AuditLogger) LogSecurityEvent(action, userID, ipAddress, userAgent string, details map[string]interface{}) {
	event := &AuditEvent{
		Level:     AuditLevelSecurity,
		Category:  "SECURITY",
		Action:    action,
		UserID:    userID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details:   details,
		Success:   false, // Security events are typically failures
	}
	al.LogEvent(event)
}

// LogRateLimitEvent logs rate limiting events
func (al *AuditLogger) LogRateLimitEvent(userID, userTier, ipAddress, userAgent string, limitType string) {
	event := &AuditEvent{
		Level:     AuditLevelWarning,
		Category:  "RATE_LIMIT",
		Action:    "RATE_LIMIT_EXCEEDED",
		UserID:    userID,
		UserTier:  userTier,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Details: map[string]interface{}{
			"limit_type": limitType,
			"tier":       userTier,
		},
		Success: false,
	}
	al.LogEvent(event)
}

// LogUserActivity logs general user activity
func (al *AuditLogger) LogUserActivity(action, userID, userTier, ipAddress, userAgent, resource string, success bool) {
	event := &AuditEvent{
		Level:     AuditLevelInfo,
		Category:  "USER_ACTIVITY",
		Action:    action,
		UserID:    userID,
		UserTier:  userTier,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Resource:  resource,
		Success:   success,
	}
	al.LogEvent(event)
}

// GetEvents returns all audit events
func (al *AuditLogger) GetEvents() []*AuditEvent {
	al.mutex <- struct{}{}
	defer func() { <-al.mutex }()

	// Return a copy to avoid race conditions
	events := make([]*AuditEvent, len(al.events))
	copy(events, al.events)
	return events
}

// GetEventsByUser returns audit events for a specific user
func (al *AuditLogger) GetEventsByUser(userID string) []*AuditEvent {
	al.mutex <- struct{}{}
	defer func() { <-al.mutex }()

	var userEvents []*AuditEvent
	for _, event := range al.events {
		if event.UserID == userID {
			userEvents = append(userEvents, event)
		}
	}
	return userEvents
}

// GetEventsByTimeRange returns audit events within a time range
func (al *AuditLogger) GetEventsByTimeRange(start, end time.Time) []*AuditEvent {
	al.mutex <- struct{}{}
	defer func() { <-al.mutex }()

	var timeEvents []*AuditEvent
	for _, event := range al.events {
		if event.Timestamp.After(start) && event.Timestamp.Before(end) {
			timeEvents = append(timeEvents, event)
		}
	}
	return timeEvents
}

// GetSecurityEvents returns all security-related events
func (al *AuditLogger) GetSecurityEvents() []*AuditEvent {
	al.mutex <- struct{}{}
	defer func() { <-al.mutex }()

	var securityEvents []*AuditEvent
	for _, event := range al.events {
		if event.Level == AuditLevelSecurity {
			securityEvents = append(securityEvents, event)
		}
	}
	return securityEvents
}

// ExportAuditLog exports audit events to JSON
func (al *AuditLogger) ExportAuditLog() ([]byte, error) {
	events := al.GetEvents()
	return json.MarshalIndent(events, "", "  ")
}

// logToStandardOutput logs the event to standard output
func (al *AuditLogger) logToStandardOutput(event *AuditEvent) {
	level := string(event.Level)
	if event.Success {
		log.Printf("[AUDIT-%s] %s: %s by user %s (tier: %s) from %s", 
			level, event.Category, event.Action, event.UserID, event.UserTier, event.IPAddress)
	} else {
		log.Printf("[AUDIT-%s] %s: %s by user %s (tier: %s) from %s - FAILED: %s", 
			level, event.Category, event.Action, event.UserID, event.UserTier, event.IPAddress, event.Error)
	}
}

// ClearEvents clears all audit events (use with caution)
func (al *AuditLogger) ClearEvents() {
	al.mutex <- struct{}{}
	defer func() { <-al.mutex }()
	al.events = make([]*AuditEvent, 0)
}

// GetEventCount returns the total number of audit events
func (al *AuditLogger) GetEventCount() int {
	al.mutex <- struct{}{}
	defer func() { <-al.mutex }()
	return len(al.events)
}
