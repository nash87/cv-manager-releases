package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

// AuditEvent represents a user activity event
type AuditEvent struct {
	ID          string                 `json:"id"`
	Timestamp   time.Time              `json:"timestamp"`
	EventType   string                 `json:"event_type"`   // e.g. "cv_created", "cv_updated", "cv_deleted", "cv_exported", "login", "logout"
	Category    string                 `json:"category"`     // e.g. "cv_management", "auth", "settings", "data_export"
	Action      string                 `json:"action"`       // e.g. "create", "update", "delete", "export", "view"
	ResourceID  string                 `json:"resource_id"`  // ID of the resource affected (CV ID, etc.)
	ResourceType string                `json:"resource_type"` // "cv", "application", "template", etc.
	UserID      string                 `json:"user_id"`      // Currently always "local_user" (for future multi-user support)
	SessionID   string                 `json:"session_id"`   // Session identifier
	IPAddress   string                 `json:"ip_address"`   // Always "127.0.0.1" for local app
	UserAgent   string                 `json:"user_agent"`   // Application version
	Success     bool                   `json:"success"`      // Whether the action was successful
	ErrorMessage string                `json:"error_message,omitempty"` // Error message if failed
	Metadata    map[string]interface{} `json:"metadata,omitempty"` // Additional context-specific data
	Duration    int64                  `json:"duration_ms,omitempty"` // Operation duration in milliseconds
	Changes     *AuditChanges          `json:"changes,omitempty"` // Before/after changes for updates
}

// AuditChanges tracks what changed in an update operation
type AuditChanges struct {
	Before map[string]interface{} `json:"before,omitempty"`
	After  map[string]interface{} `json:"after,omitempty"`
	Fields []string               `json:"fields"` // List of changed field names
}

// AuditStats represents statistics about audit events
type AuditStats struct {
	TotalEvents      int            `json:"total_events"`
	EventsByType     map[string]int `json:"events_by_type"`
	EventsByCategory map[string]int `json:"events_by_category"`
	EventsByAction   map[string]int `json:"events_by_action"`
	SuccessRate      float64        `json:"success_rate"`
	FailureCount     int            `json:"failure_count"`
	FirstEvent       *time.Time     `json:"first_event,omitempty"`
	LastEvent        *time.Time     `json:"last_event,omitempty"`
	LastHourCount    int            `json:"last_hour_count"`
	TodayCount       int            `json:"today_count"`
	ThisWeekCount    int            `json:"this_week_count"`
	ThisMonthCount   int            `json:"this_month_count"`
}

// AuditFilter for filtering audit events
type AuditFilter struct {
	StartDate    *time.Time `json:"start_date,omitempty"`
	EndDate      *time.Time `json:"end_date,omitempty"`
	EventTypes   []string   `json:"event_types,omitempty"`
	Categories   []string   `json:"categories,omitempty"`
	Actions      []string   `json:"actions,omitempty"`
	ResourceType string     `json:"resource_type,omitempty"`
	ResourceID   string     `json:"resource_id,omitempty"`
	SuccessOnly  bool       `json:"success_only"`
	FailureOnly  bool       `json:"failure_only"`
	Limit        int        `json:"limit"`        // Max number of results
	Offset       int        `json:"offset"`       // For pagination
	SortBy       string     `json:"sort_by"`      // "timestamp", "event_type", etc.
	SortOrder    string     `json:"sort_order"`   // "asc" or "desc"
}

// AuditManager handles audit logging
type AuditManager struct {
	dataPath  string
	sessionID string
	appVersion string
}

// NewAuditManager creates a new audit manager
func NewAuditManager(dataPath, appVersion string) *AuditManager {
	return &AuditManager{
		dataPath:   dataPath,
		sessionID:  uuid.New().String(),
		appVersion: appVersion,
	}
}

// LogEvent logs an audit event
func (am *AuditManager) LogEvent(event *AuditEvent) error {
	// Set defaults
	if event.ID == "" {
		event.ID = uuid.New().String()
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}
	if event.UserID == "" {
		event.UserID = "local_user"
	}
	if event.SessionID == "" {
		event.SessionID = am.sessionID
	}
	if event.IPAddress == "" {
		event.IPAddress = "127.0.0.1"
	}
	if event.UserAgent == "" {
		event.UserAgent = "CV Manager Pro v" + am.appVersion
	}

	// Ensure logs directory exists
	logsDir := filepath.Join(am.dataPath, "logs")
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return fmt.Errorf("failed to create logs directory: %v", err)
	}

	// Create daily log file
	dateStr := event.Timestamp.Format("2006-01-02")
	logFile := filepath.Join(logsDir, fmt.Sprintf("audit-%s.jsonl", dateStr))

	// Append to log file (JSON Lines format)
	f, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("failed to open log file: %v", err)
	}
	defer f.Close()

	// Write event as JSON line
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %v", err)
	}

	if _, err := f.Write(append(data, '\n')); err != nil {
		return fmt.Errorf("failed to write event: %v", err)
	}

	fmt.Printf("[Audit] %s | %s | %s | %s | Success: %v\n",
		event.Timestamp.Format("15:04:05"),
		event.Category,
		event.EventType,
		event.ResourceID,
		event.Success,
	)

	return nil
}

// GetAllEvents retrieves all audit events with optional filtering
func (am *AuditManager) GetAllEvents(filter *AuditFilter) ([]*AuditEvent, error) {
	logsDir := filepath.Join(am.dataPath, "logs")

	// Get all log files
	files, err := filepath.Glob(filepath.Join(logsDir, "audit-*.jsonl"))
	if err != nil {
		return nil, fmt.Errorf("failed to list log files: %v", err)
	}

	var events []*AuditEvent

	// Read all log files
	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			fmt.Printf("[Audit] Warning: failed to read %s: %v\n", file, err)
			continue
		}

		// Parse JSON Lines
		lines := splitLines(data)
		for _, line := range lines {
			if len(line) == 0 {
				continue
			}

			var event AuditEvent
			if err := json.Unmarshal(line, &event); err != nil {
				fmt.Printf("[Audit] Warning: failed to parse event: %v\n", err)
				continue
			}

			// Apply filter
			if filter != nil && !am.matchesFilter(&event, filter) {
				continue
			}

			events = append(events, &event)
		}
	}

	// Apply limit and offset
	if filter != nil {
		if filter.Offset > 0 && filter.Offset < len(events) {
			events = events[filter.Offset:]
		}
		if filter.Limit > 0 && filter.Limit < len(events) {
			events = events[:filter.Limit]
		}
	}

	return events, nil
}

// GetEventsByResource gets all events for a specific resource
func (am *AuditManager) GetEventsByResource(resourceType, resourceID string) ([]*AuditEvent, error) {
	filter := &AuditFilter{
		ResourceType: resourceType,
		ResourceID:   resourceID,
		SortBy:       "timestamp",
		SortOrder:    "desc",
	}
	return am.GetAllEvents(filter)
}

// GetEventsByDateRange gets events within a date range
func (am *AuditManager) GetEventsByDateRange(startDate, endDate time.Time) ([]*AuditEvent, error) {
	filter := &AuditFilter{
		StartDate: &startDate,
		EndDate:   &endDate,
		SortBy:    "timestamp",
		SortOrder: "desc",
	}
	return am.GetAllEvents(filter)
}

// GetStats calculates audit statistics
func (am *AuditManager) GetStats() (*AuditStats, error) {
	events, err := am.GetAllEvents(nil)
	if err != nil {
		return nil, err
	}

	stats := &AuditStats{
		TotalEvents:      len(events),
		EventsByType:     make(map[string]int),
		EventsByCategory: make(map[string]int),
		EventsByAction:   make(map[string]int),
	}

	now := time.Now()
	hourAgo := now.Add(-1 * time.Hour)
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -int(now.Weekday()))
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	successCount := 0

	for _, event := range events {
		// Track first and last events
		if stats.FirstEvent == nil || event.Timestamp.Before(*stats.FirstEvent) {
			stats.FirstEvent = &event.Timestamp
		}
		if stats.LastEvent == nil || event.Timestamp.After(*stats.LastEvent) {
			stats.LastEvent = &event.Timestamp
		}

		// Count by type, category, action
		stats.EventsByType[event.EventType]++
		stats.EventsByCategory[event.Category]++
		stats.EventsByAction[event.Action]++

		// Count success/failure
		if event.Success {
			successCount++
		} else {
			stats.FailureCount++
		}

		// Time-based counts
		if event.Timestamp.After(hourAgo) {
			stats.LastHourCount++
		}
		if event.Timestamp.After(todayStart) {
			stats.TodayCount++
		}
		if event.Timestamp.After(weekStart) {
			stats.ThisWeekCount++
		}
		if event.Timestamp.After(monthStart) {
			stats.ThisMonthCount++
		}
	}

	// Calculate success rate
	if stats.TotalEvents > 0 {
		stats.SuccessRate = float64(successCount) / float64(stats.TotalEvents) * 100
	}

	return stats, nil
}

// ExportEvents exports events to JSON file
func (am *AuditManager) ExportEvents(filter *AuditFilter, outputPath string) error {
	events, err := am.GetAllEvents(filter)
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(events, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal events: %v", err)
	}

	if err := os.WriteFile(outputPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write export file: %v", err)
	}

	return nil
}

// DeleteOldLogs deletes logs older than the specified days
func (am *AuditManager) DeleteOldLogs(days int) (int, error) {
	logsDir := filepath.Join(am.dataPath, "logs")
	files, err := filepath.Glob(filepath.Join(logsDir, "audit-*.jsonl"))
	if err != nil {
		return 0, err
	}

	cutoffDate := time.Now().AddDate(0, 0, -days)
	deletedCount := 0

	for _, file := range files {
		info, err := os.Stat(file)
		if err != nil {
			continue
		}

		if info.ModTime().Before(cutoffDate) {
			if err := os.Remove(file); err != nil {
				fmt.Printf("[Audit] Warning: failed to delete %s: %v\n", file, err)
				continue
			}
			deletedCount++
		}
	}

	return deletedCount, nil
}

// matchesFilter checks if an event matches the filter criteria
func (am *AuditManager) matchesFilter(event *AuditEvent, filter *AuditFilter) bool {
	// Date range
	if filter.StartDate != nil && event.Timestamp.Before(*filter.StartDate) {
		return false
	}
	if filter.EndDate != nil && event.Timestamp.After(*filter.EndDate) {
		return false
	}

	// Event types
	if len(filter.EventTypes) > 0 && !contains(filter.EventTypes, event.EventType) {
		return false
	}

	// Categories
	if len(filter.Categories) > 0 && !contains(filter.Categories, event.Category) {
		return false
	}

	// Actions
	if len(filter.Actions) > 0 && !contains(filter.Actions, event.Action) {
		return false
	}

	// Resource
	if filter.ResourceType != "" && event.ResourceType != filter.ResourceType {
		return false
	}
	if filter.ResourceID != "" && event.ResourceID != filter.ResourceID {
		return false
	}

	// Success/Failure
	if filter.SuccessOnly && !event.Success {
		return false
	}
	if filter.FailureOnly && event.Success {
		return false
	}

	return true
}

// Helper functions

func splitLines(data []byte) [][]byte {
	var lines [][]byte
	var line []byte

	for _, b := range data {
		if b == '\n' {
			if len(line) > 0 {
				lines = append(lines, line)
				line = nil
			}
		} else {
			line = append(line, b)
		}
	}

	if len(line) > 0 {
		lines = append(lines, line)
	}

	return lines
}

func contains(slice []string, str string) bool {
	for _, s := range slice {
		if s == str {
			return true
		}
	}
	return false
}

// ==================== Convenience Methods ====================

// LogCVCreated logs a CV creation event
func (am *AuditManager) LogCVCreated(cvID string, metadata map[string]interface{}) error {
	return am.LogEvent(&AuditEvent{
		EventType:    "cv_created",
		Category:     "cv_management",
		Action:       "create",
		ResourceID:   cvID,
		ResourceType: "cv",
		Success:      true,
		Metadata:     metadata,
	})
}

// LogCVUpdated logs a CV update event
func (am *AuditManager) LogCVUpdated(cvID string, changes *AuditChanges, metadata map[string]interface{}) error {
	return am.LogEvent(&AuditEvent{
		EventType:    "cv_updated",
		Category:     "cv_management",
		Action:       "update",
		ResourceID:   cvID,
		ResourceType: "cv",
		Success:      true,
		Changes:      changes,
		Metadata:     metadata,
	})
}

// LogCVDeleted logs a CV deletion event
func (am *AuditManager) LogCVDeleted(cvID string, metadata map[string]interface{}) error {
	return am.LogEvent(&AuditEvent{
		EventType:    "cv_deleted",
		Category:     "cv_management",
		Action:       "delete",
		ResourceID:   cvID,
		ResourceType: "cv",
		Success:      true,
		Metadata:     metadata,
	})
}

// LogCVExported logs a CV export event
func (am *AuditManager) LogCVExported(cvID string, format string, metadata map[string]interface{}) error {
	if metadata == nil {
		metadata = make(map[string]interface{})
	}
	metadata["export_format"] = format

	return am.LogEvent(&AuditEvent{
		EventType:    "cv_exported",
		Category:     "cv_management",
		Action:       "export",
		ResourceID:   cvID,
		ResourceType: "cv",
		Success:      true,
		Metadata:     metadata,
	})
}

// LogError logs an error event
func (am *AuditManager) LogError(eventType, action, resourceID string, err error) error {
	return am.LogEvent(&AuditEvent{
		EventType:    eventType + "_failed",
		Category:     "error",
		Action:       action,
		ResourceID:   resourceID,
		Success:      false,
		ErrorMessage: err.Error(),
	})
}
