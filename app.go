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

	// Get executable directory
	exePath, err := os.Executable()
	if err != nil {
		fmt.Printf("Failed to get executable path: %v\n", err)
		exePath = "."
	}
	exeDir := filepath.Dir(exePath)

	// Create encrypted storage next to EXE
	storageDir := filepath.Join(exeDir, "cv-data")

	// Use machine-specific master password (in production, user should set this)
	// For now, we use a default that's better than nothing
	masterPassword := "cv-manager-pro-default-key-change-in-production"

	storage, err := NewEncryptedStorage(storageDir, masterPassword)
	if err != nil {
		fmt.Printf("Failed to initialize encrypted storage: %v\n", err)
		// Use temp directory as fallback
		tempDir := os.TempDir()
		storage, _ = NewEncryptedStorage(filepath.Join(tempDir, "cv-manager-encrypted"), masterPassword)
	}

	a.encryptedStore = storage
}

// ========== GDPR & Consent Methods ==========

// GetConsent returns current user consent
func (a *App) GetConsent() *UserConsent {
	return a.encryptedStore.GetConsent()
}

// GrantConsent grants user consent for data processing
func (a *App) GrantConsent() error {
	return a.encryptedStore.GrantConsent()
}

// WithdrawConsent withdraws user consent
func (a *App) WithdrawConsent() error {
	return a.encryptedStore.WithdrawConsent()
}

// GetSecurityInfo returns security and compliance information
func (a *App) GetSecurityInfo() SecurityInfo {
	return a.encryptedStore.GetSecurityInfo()
}

// GetComplianceLog returns compliance log
func (a *App) GetComplianceLog() []ComplianceEntry {
	return a.encryptedStore.GetComplianceLog()
}

// ExportAllDataGDPR exports all user data (Art. 20 GDPR)
func (a *App) ExportAllDataGDPR() (string, error) {
	return a.encryptedStore.ExportAllData()
}

// DeleteAllDataGDPR deletes all user data (Art. 17 GDPR)
func (a *App) DeleteAllDataGDPR() error {
	return a.encryptedStore.DeleteAllData()
}

// ========== CV Management Methods ==========

// GetAllCVs returns all CV summaries for dashboard
func (a *App) GetAllCVs() ([]CVSummary, error) {
	cvs, err := a.encryptedStore.GetAllCVs()
	if err != nil {
		return nil, err
	}

	summaries := make([]CVSummary, len(cvs))
	for i, cv := range cvs {
		summaries[i] = cv.ToSummary()
	}
	return summaries, nil
}

// GetCV returns a full CV by ID
func (a *App) GetCV(id string) (*CV, error) {
	cv, err := a.encryptedStore.GetCV(id)
	if err != nil {
		return nil, err
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
	return a.encryptedStore.CreateCV()
}

// SaveCV saves a CV
func (a *App) SaveCV(cv *CV) error {
	return a.encryptedStore.SaveCV(cv)
}

// DeleteCV deletes a CV
func (a *App) DeleteCV(id string) error {
	return a.encryptedStore.DeleteCV(id)
}

// SearchCVs searches CVs
func (a *App) SearchCVs(query string) ([]CVSummary, error) {
	cvs, err := a.encryptedStore.SearchCVs(query)
	if err != nil {
		return nil, err
	}

	summaries := make([]CVSummary, len(cvs))
	for i, cv := range cvs {
		summaries[i] = cv.ToSummary()
	}
	return summaries, nil
}

// GetStatistics returns CV statistics
func (a *App) GetStatistics() (*Statistics, error) {
	return a.encryptedStore.GetStatistics()
}

// ========== Export Methods ==========

// ExportPDF exports CV to PDF
func (a *App) ExportPDF(id string) (string, error) {
	cv, err := a.encryptedStore.GetCV(id)
	if err != nil {
		return "", err
	}

	// Update export analytics
	cv.ExportCount++
	now := Now()
	cv.LastExported = &now
	a.encryptedStore.SaveCV(cv)

	// Generate PDF
	return ExportToPDF(cv)
}

// Helper function to get current time
func Now() time.Time {
	return time.Now()
}

// ========== Storage Seal/Unseal Methods ==========

// GetSealStatus returns the current seal status
func (a *App) GetSealStatus() (*StorageSealConfig, error) {
	return a.encryptedStore.GetSealStatus()
}

// SealStorage seals the storage with a master password
func (a *App) SealStorage(masterPassword string) error {
	return a.encryptedStore.SealStorage(masterPassword)
}

// UnsealStorage unseals the storage with the master password
func (a *App) UnsealStorage(masterPassword string) error {
	return a.encryptedStore.UnsealStorage(masterPassword)
}

// RemoveSeal removes the seal entirely
func (a *App) RemoveSeal(masterPassword string) error {
	return a.encryptedStore.RemoveSeal(masterPassword)
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
