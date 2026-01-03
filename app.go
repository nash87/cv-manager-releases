package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// App struct
type App struct {
	ctx            context.Context
	encryptedStore *EncryptedStorage
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Check for pending update and install it
	a.checkAndInstallPendingUpdate()

	// Get executable directory
	exePath, err := os.Executable()
	if err != nil {
		fmt.Printf("Failed to get executable path: %v\n", err)
		exePath = "."
	}
	exeDir := filepath.Dir(exePath)

	// Create encrypted storage next to EXE
	storageDir := filepath.Join(exeDir, "cv-data")

	// Use secure machine-specific master password
	// Priority: ENV variable > stored key > generated machine key
	masterPassword := GetMasterPassword(storageDir)

	storage, err := NewEncryptedStorage(storageDir, masterPassword)
	if err != nil {
		fmt.Printf("Failed to initialize encrypted storage: %v\n", err)
		// Use temp directory as fallback
		tempDir := os.TempDir()
		storage, _ = NewEncryptedStorage(filepath.Join(tempDir, "cv-manager-encrypted"), masterPassword)
	}

	a.encryptedStore = storage

	// Start automatic update check in background after 1 second
	go func() {
		time.Sleep(1 * time.Second)
		fmt.Println("[AutoUpdate] Starting automatic update check...")

		status, err := a.CheckForUpdates()
		if err != nil {
			fmt.Printf("[AutoUpdate] Check failed: %v\n", err)
			return
		}

		if status.UpdateAvailable {
			fmt.Printf("[AutoUpdate] Update available: %s -> %s\n", status.CurrentVersion, status.LatestVersion)
			fmt.Println("[AutoUpdate] Starting silent download...")

			// Download silently in background
			result, err := a.DownloadUpdate(status.DownloadURL, status.SHA256)
			if err != nil {
				fmt.Printf("[AutoUpdate] Download failed: %v\n", err)
				return
			}

			if result.Error != "" {
				fmt.Printf("[AutoUpdate] Download error: %s\n", result.Error)
				return
			}

			fmt.Println("[AutoUpdate] Download complete! Update will be installed on next start.")
		} else {
			fmt.Println("[AutoUpdate] Already on latest version")
		}
	}()
}

// checkAndInstallPendingUpdate checks if there's a downloaded update and installs it
func (a *App) checkAndInstallPendingUpdate() {
	updateFile := filepath.Join(os.TempDir(), "cv-manager-pro-update.exe")

	// Check if update file exists
	if _, err := os.Stat(updateFile); os.IsNotExist(err) {
		return // No pending update
	}

	fmt.Println("[Startup] Found pending update, installing...")

	// Apply the update (this will restart the app)
	if err := a.ApplyUpdate(); err != nil {
		fmt.Printf("[Startup] Failed to install update: %v\n", err)
		// Clean up failed update
		os.Remove(updateFile)
	}
}

// ========== GDPR & Consent Methods ==========

// GetConsent returns current user consent
func (a *App) GetConsent() *UserConsent {
	if a.encryptedStore == nil {
		return nil
	}
	return a.encryptedStore.GetConsent()
}

// GrantConsent grants user consent for data processing
func (a *App) GrantConsent() error {
	if a.encryptedStore == nil {
		return fmt.Errorf("storage not initialized")
	}
	return a.encryptedStore.GrantConsent()
}

// WithdrawConsent withdraws user consent
func (a *App) WithdrawConsent() error {
	if a.encryptedStore == nil {
		return fmt.Errorf("storage not initialized")
	}
	return a.encryptedStore.WithdrawConsent()
}

// GetSecurityInfo returns security and compliance information
func (a *App) GetSecurityInfo() SecurityInfo {
	if a.encryptedStore == nil {
		return SecurityInfo{}
	}
	return a.encryptedStore.GetSecurityInfo()
}

// GetComplianceLog returns compliance log
func (a *App) GetComplianceLog() []ComplianceEntry {
	if a.encryptedStore == nil {
		return []ComplianceEntry{}
	}
	return a.encryptedStore.GetComplianceLog()
}

// ExportAllDataGDPR exports all user data (Art. 20 GDPR)
func (a *App) ExportAllDataGDPR() (string, error) {
	if a.encryptedStore == nil {
		return "", fmt.Errorf("storage not initialized")
	}
	data, err := a.encryptedStore.ExportAllData()
	if err != nil {
		return "", fmt.Errorf("GDPR export failed: %w", err)
	}
	return data, nil
}

// DeleteAllDataGDPR deletes all user data (Art. 17 GDPR)
func (a *App) DeleteAllDataGDPR() error {
	if a.encryptedStore == nil {
		return fmt.Errorf("storage not initialized")
	}
	if err := a.encryptedStore.DeleteAllData(); err != nil {
		return fmt.Errorf("GDPR deletion failed: %w", err)
	}
	return nil
}

// ========== CV Management Methods ==========

// GetAllCVs returns all CV summaries for dashboard
func (a *App) GetAllCVs() ([]CVSummary, error) {
	if a.encryptedStore == nil {
		return nil, fmt.Errorf("storage not initialized")
	}
	cvs, err := a.encryptedStore.GetAllCVs()
	if err != nil {
		return nil, fmt.Errorf("failed to get CVs: %w", err)
	}

	summaries := make([]CVSummary, len(cvs))
	for i, cv := range cvs {
		summaries[i] = cv.ToSummary()
	}
	return summaries, nil
}

// GetCV returns a full CV by ID
func (a *App) GetCV(id string) (*CV, error) {
	if a.encryptedStore == nil {
		return nil, fmt.Errorf("storage not initialized")
	}
	if id == "" {
		return nil, fmt.Errorf("CV ID is required")
	}
	cv, err := a.encryptedStore.GetCV(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get CV %s: %w", id, err)
	}

	// Update analytics
	cv.ViewCount++
	now := Now()
	cv.LastViewed = &now
	a.encryptedStore.SaveCV(cv)

	return cv, nil
}

// CreateCV creates a new CV
func (a *App) CreateCV() (*CV, error) {
	if a.encryptedStore == nil {
		return nil, fmt.Errorf("storage not initialized")
	}
	cv, err := a.encryptedStore.CreateCV()
	if err != nil {
		return nil, fmt.Errorf("failed to create CV: %w", err)
	}
	return cv, nil
}

// SaveCV saves a CV
func (a *App) SaveCV(cv *CV) error {
	if a.encryptedStore == nil {
		return fmt.Errorf("storage not initialized")
	}
	if cv == nil {
		return fmt.Errorf("CV is nil")
	}
	if err := a.encryptedStore.SaveCV(cv); err != nil {
		return fmt.Errorf("failed to save CV: %w", err)
	}
	return nil
}

// DeleteCV deletes a CV
func (a *App) DeleteCV(id string) error {
	if a.encryptedStore == nil {
		return fmt.Errorf("storage not initialized")
	}
	if id == "" {
		return fmt.Errorf("CV ID is required")
	}
	if err := a.encryptedStore.DeleteCV(id); err != nil {
		return fmt.Errorf("failed to delete CV %s: %w", id, err)
	}
	return nil
}

// BulkDeleteCVs deletes multiple CVs at once
func (a *App) BulkDeleteCVs(ids []string) error {
	if a.encryptedStore == nil {
		return fmt.Errorf("storage not initialized")
	}

	var lastErr error
	for _, id := range ids {
		if err := a.encryptedStore.DeleteCV(id); err != nil {
			lastErr = err
			fmt.Printf("[BulkDelete] Failed to delete CV %s: %v\n", id, err)
		}
	}

	return lastErr
}

// ToggleFavorite toggles the favorite status of a CV
func (a *App) ToggleFavorite(id string) error {
	if a.encryptedStore == nil {
		return fmt.Errorf("storage not initialized")
	}

	cv, err := a.encryptedStore.GetCV(id)
	if err != nil {
		return err
	}

	// Toggle favorite
	cv.IsFavorite = !cv.IsFavorite
	cv.UpdatedAt = time.Now()
	return a.encryptedStore.SaveCV(cv)
}

// GetFavoriteCVs returns all favorite CVs
func (a *App) GetFavoriteCVs() ([]CVSummary, error) {
	if a.encryptedStore == nil {
		return nil, fmt.Errorf("storage not initialized")
	}

	allCVs, err := a.encryptedStore.GetAllCVs()
	if err != nil {
		return nil, err
	}

	favorites := []CVSummary{}
	for _, cv := range allCVs {
		// Filter only favorites
		if cv.IsFavorite {
			summary := cv.ToSummary()
			favorites = append(favorites, summary)
		}
	}

	return favorites, nil
}

// SearchCVs searches CVs
func (a *App) SearchCVs(query string) ([]CVSummary, error) {
	if a.encryptedStore == nil {
		return nil, fmt.Errorf("storage not initialized")
	}
	cvs, err := a.encryptedStore.SearchCVs(query)
	if err != nil {
		return nil, fmt.Errorf("search failed: %w", err)
	}

	summaries := make([]CVSummary, len(cvs))
	for i, cv := range cvs {
		summaries[i] = cv.ToSummary()
	}
	return summaries, nil
}

// GetStatistics returns CV statistics
func (a *App) GetStatistics() (*Statistics, error) {
	if a.encryptedStore == nil {
		return nil, fmt.Errorf("storage not initialized")
	}
	stats, err := a.encryptedStore.GetStatistics()
	if err != nil {
		return nil, fmt.Errorf("failed to get statistics: %w", err)
	}
	return stats, nil
}

// ========== Export Methods ==========

// ExportPDF exports CV to PDF
func (a *App) ExportPDF(id string) (string, error) {
	if a.encryptedStore == nil {
		return "", fmt.Errorf("storage not initialized")
	}
	if id == "" {
		return "", fmt.Errorf("CV ID is required")
	}
	cv, err := a.encryptedStore.GetCV(id)
	if err != nil {
		return "", fmt.Errorf("failed to get CV for export: %w", err)
	}

	// Update export analytics
	cv.ExportCount++
	now := Now()
	cv.LastExported = &now
	a.encryptedStore.SaveCV(cv)

	// Generate PDF
	pdfPath, err := ExportToPDF(cv)
	if err != nil {
		return "", fmt.Errorf("PDF generation failed: %w", err)
	}
	return pdfPath, nil
}

// Helper function to get current time
func Now() time.Time {
	return time.Now()
}

// ========== Storage Seal/Unseal Methods ==========

// GetSealStatus returns the current seal status
func (a *App) GetSealStatus() (*StorageSealConfig, error) {
	if a.encryptedStore == nil {
		return nil, fmt.Errorf("storage not initialized")
	}
	status, err := a.encryptedStore.GetSealStatus()
	if err != nil {
		return nil, fmt.Errorf("failed to get seal status: %w", err)
	}
	return status, nil
}

// SealStorage seals the storage with a master password
func (a *App) SealStorage(masterPassword string) error {
	if a.encryptedStore == nil {
		return fmt.Errorf("storage not initialized")
	}
	if masterPassword == "" {
		return fmt.Errorf("master password is required")
	}
	if err := a.encryptedStore.SealStorage(masterPassword); err != nil {
		return fmt.Errorf("failed to seal storage: %w", err)
	}
	return nil
}

// UnsealStorage unseals the storage with the master password
func (a *App) UnsealStorage(masterPassword string) error {
	if a.encryptedStore == nil {
		return fmt.Errorf("storage not initialized")
	}
	if masterPassword == "" {
		return fmt.Errorf("master password is required")
	}
	if err := a.encryptedStore.UnsealStorage(masterPassword); err != nil {
		return fmt.Errorf("failed to unseal storage: %w", err)
	}
	return nil
}

// RemoveSeal removes the seal entirely
func (a *App) RemoveSeal(masterPassword string) error {
	if a.encryptedStore == nil {
		return fmt.Errorf("storage not initialized")
	}
	if masterPassword == "" {
		return fmt.Errorf("master password is required")
	}
	if err := a.encryptedStore.RemoveSeal(masterPassword); err != nil {
		return fmt.Errorf("failed to remove seal: %w", err)
	}
	return nil
}

// ========== App Configuration Methods ==========

// GetAppConfig returns the current app configuration
func (a *App) GetAppConfig() (*AppConfig, error) {
	return a.encryptedStore.GetAppConfig()
}

// MarkOnboardingCompleted marks onboarding as completed
func (a *App) MarkOnboardingCompleted() error {
	return a.encryptedStore.MarkOnboardingCompleted()
}

// ========== Job Application Management Methods ==========

// GetAllApplications returns all job applications
func (a *App) GetAllApplications() ([]*JobApplication, error) {
	return a.encryptedStore.GetAllApplications()
}

// GetApplication returns a specific job application by ID
func (a *App) GetApplication(id string) (*JobApplication, error) {
	return a.encryptedStore.GetApplication(id)
}

// CreateApplication creates a new job application
func (a *App) CreateApplication() (*JobApplication, error) {
	app := NewJobApplication()
	err := a.encryptedStore.SaveApplication(app)
	return app, err
}

// SaveApplication saves a job application
func (a *App) SaveApplication(app *JobApplication) error {
	app.UpdatedAt = time.Now()
	return a.encryptedStore.SaveApplication(app)
}

// DeleteApplication deletes a job application
func (a *App) DeleteApplication(id string) error {
	return a.encryptedStore.DeleteApplication(id)
}

// UpdateApplicationStatus updates application status and adds timeline event
func (a *App) UpdateApplicationStatus(id string, status ApplicationStatus, details string) error {
	app, err := a.encryptedStore.GetApplication(id)
	if err != nil {
		return err
	}
	app.UpdateStatus(status, details)
	return a.encryptedStore.SaveApplication(app)
}

// AddApplicationTimelineEvent adds a timeline event to an application
func (a *App) AddApplicationTimelineEvent(id, eventType, title, details string) error {
	app, err := a.encryptedStore.GetApplication(id)
	if err != nil {
		return err
	}
	app.AddTimelineEvent(eventType, title, details)
	return a.encryptedStore.SaveApplication(app)
}

// AddApplicationFeedback adds feedback to an application
func (a *App) AddApplicationFeedback(id, feedbackType, title, content string, rating int) error {
	app, err := a.encryptedStore.GetApplication(id)
	if err != nil {
		return err
	}
	app.AddFeedback(feedbackType, title, content, rating)
	return a.encryptedStore.SaveApplication(app)
}

// GetApplicationsByCV returns all applications linked to a specific CV
func (a *App) GetApplicationsByCV(cvID string) ([]*JobApplication, error) {
	return a.encryptedStore.GetApplicationsByCV(cvID)
}

// GetApplicationsStatistics returns statistics for job applications
func (a *App) GetApplicationsStatistics() (*ApplicationsStatistics, error) {
	return a.encryptedStore.GetApplicationsStatistics()
}

// GetJobPortals returns list of available job portals
func (a *App) GetJobPortals() []JobPortal {
	return []JobPortal{
		PortalIndeed,
		PortalLinkedIn,
		PortalStepStone,
		PortalXing,
		PortalGlassdoor,
		PortalKununu,
		PortalMonsterDE,
		PortalJobware,
		PortalCompanyWeb,
		PortalOther,
	}
}

// ========== Version & Update Methods ==========

// GetBuildInfo returns build and version information
func (a *App) GetBuildInfo() BuildInfo {
	return GetBuildInfo()
}

// GetVersion returns the current version string
func (a *App) GetVersion() string {
	return GetVersion()
}

// GetChangeLog returns the version changelog
func (a *App) GetChangeLog() []ChangeLogEntry {
	return GetChangeLog()
}

// ========== Audit Methods ==========

// GetAuditEvents retrieves audit events with optional filtering
func (a *App) GetAuditEvents(filter *AuditFilter) ([]*AuditEvent, error) {
	return a.encryptedStore.GetAuditEvents(filter)
}

// GetAuditStats retrieves audit statistics
func (a *App) GetAuditStats() (*AuditStats, error) {
	return a.encryptedStore.GetAuditStats()
}

// GetAuditEventsByResource retrieves audit events for a specific resource
func (a *App) GetAuditEventsByResource(resourceType, resourceID string) ([]*AuditEvent, error) {
	return a.encryptedStore.GetAuditEventsByResource(resourceType, resourceID)
}

// ExportAuditEvents exports audit events to JSON file
func (a *App) ExportAuditEvents(filter *AuditFilter) (string, error) {
	outputPath := filepath.Join(a.encryptedStore.dataPath, "exports", fmt.Sprintf("audit_export_%s.json", time.Now().Format("2006-01-02_15-04-05")))

	// Ensure exports directory exists
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return "", err
	}

	if err := a.encryptedStore.ExportAuditEvents(filter, outputPath); err != nil {
		return "", err
	}

	return outputPath, nil
}

// DeleteOldAuditLogs deletes audit logs older than the specified days
func (a *App) DeleteOldAuditLogs(days int) (int, error) {
	return a.encryptedStore.DeleteOldAuditLogs(days)
}
