package main

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Launcher represents the launcher application
type Launcher struct {
	ctx            context.Context
	dataPath       string
	launcherPath   string
	mainAppPath    string
	configPath     string
	config         *LauncherConfig
}

// LauncherConfig stores launcher configuration
type LauncherConfig struct {
	DataLocation        string    `json:"data_location"`        // Where user data is stored
	AutoUpdate          bool      `json:"auto_update"`          // Auto-update enabled
	LastUpdateCheck     time.Time `json:"last_update_check"`
	LauncherVersion     string    `json:"launcher_version"`
	AppVersion          string    `json:"app_version"`
	OnboardingCompleted bool      `json:"onboarding_completed"` // Onboarding wizard done
}

// OnboardingData contains user info from onboarding wizard
type OnboardingData struct {
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	Email       string `json:"email"`
	JobTitle    string `json:"jobTitle"`
	Template    string `json:"template"`
	ColorScheme string `json:"colorScheme"`
}

// UpdateInfo contains update information from GitHub
type UpdateInfo struct {
	LatestVersion  string `json:"latest_version"`
	ReleaseDate    string `json:"release_date"`
	DownloadURL    string `json:"download_url"`
	ChangelogURL   string `json:"changelog_url"`
	ReleaseNotes   string `json:"release_notes"`
	SHA256         string `json:"sha256"`
	SizeMB         int    `json:"size_mb"`
	IsRequired     bool   `json:"is_required"` // Force update
	CommitHash     string `json:"commit_hash"` // Git commit hash
}

// UpdateStatus represents current update status
type UpdateStatus struct {
	Component         string `json:"component"`          // "launcher" or "app"
	CurrentVersion    string `json:"current_version"`
	LatestVersion     string `json:"latest_version"`
	UpdateAvailable   bool   `json:"update_available"`
	IsRequired        bool   `json:"is_required"`
	ReleaseNotes      string `json:"release_notes"`
	ReleaseDate       string `json:"release_date"`
	CommitHash        string `json:"commit_hash"`
	DownloadURL       string `json:"download_url"`
	SHA256            string `json:"sha256"`
	SizeMB            int    `json:"size_mb"`
	Checking          bool   `json:"checking"`
	Error             string `json:"error"`
}

// DownloadProgress tracks download progress
type DownloadProgress struct {
	Component       string  `json:"component"`
	BytesDownloaded int64   `json:"bytes_downloaded"`
	TotalBytes      int64   `json:"total_bytes"`
	PercentComplete int     `json:"percent_complete"`
	SpeedMBps       float64 `json:"speed_mbps"`
	ETASeconds      int     `json:"eta_seconds"`
	Status          string  `json:"status"` // downloading, verifying, installing, complete, error
	Error           string  `json:"error"`
}

// GitHubRelease represents a GitHub release
type GitHubRelease struct {
	TagName     string `json:"tag_name"`
	Name        string `json:"name"`
	Body        string `json:"body"`
	PublishedAt string `json:"published_at"`
	HTMLURL     string `json:"html_url"`
	Assets      []struct {
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
		Size               int64  `json:"size"`
	} `json:"assets"`
}

// GitHubCommit represents a GitHub commit
type GitHubCommit struct {
	SHA    string `json:"sha"`
	Commit struct {
		Message string `json:"message"`
		Author  struct {
			Name string `json:"name"`
			Date string `json:"date"`
		} `json:"author"`
	} `json:"commit"`
	HTMLURL string `json:"html_url"`
}

// ReleaseInfo contains combined release information for frontend
type ReleaseInfo struct {
	Version      string   `json:"version"`
	ReleaseDate  string   `json:"release_date"`
	ReleaseNotes string   `json:"release_notes"`
	CommitHash   string   `json:"commit_hash"`
	CommitMsg    string   `json:"commit_msg"`
	ChangelogURL string   `json:"changelog_url"`
	Changes      []string `json:"changes"`
}

const (
	LauncherVersion      = "1.3.1"
	LauncherBuildDate    = "2026-01-03"

	GitHubOwner          = "nash87"
	GitHubRepo           = "cv-manager-releases"
	GitHubBranch         = "main"

	// Use GitHub API for version checks (no caching issues unlike raw.githubusercontent.com)
	AppVersionURL        = "https://api.github.com/repos/" + GitHubOwner + "/" + GitHubRepo + "/contents/version.json?ref=" + GitHubBranch
	LauncherVersionURL   = "https://api.github.com/repos/" + GitHubOwner + "/" + GitHubRepo + "/contents/launcher-version.json?ref=" + GitHubBranch
	GitHubReleasesAPI    = "https://api.github.com/repos/" + GitHubOwner + "/" + GitHubRepo + "/releases"
	GitHubCommitsAPI     = "https://api.github.com/repos/" + GitHubOwner + "/" + GitHubRepo + "/commits"

	MainAppExecutable    = "cv-manager.exe"
	LauncherExecutable   = "cv-manager-launcher.exe"
	ConfigFile           = "launcher-config.json"
)

// NewLauncher creates a new launcher instance
func NewLauncher() *Launcher {
	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)

	// Setup logging to file
	logPath := filepath.Join(exeDir, "launcher.log")
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err == nil {
		// Write to both stdout and file
		multiWriter := io.MultiWriter(os.Stdout, logFile)
		log.SetOutput(multiWriter)
		log.SetFlags(log.LstdFlags | log.Lshortfile)
	}

	log.Printf("[Launcher] CV Manager Launcher v%s\n", LauncherVersion)
	log.Printf("[Launcher] Log file: %s\n", logPath)
	log.Printf("[Launcher] Executable: %s\n", exePath)
	log.Printf("[Launcher] Working directory: %s\n", exeDir)

	return &Launcher{
		launcherPath: exePath,
		mainAppPath:  filepath.Join(exeDir, MainAppExecutable),
		configPath:   filepath.Join(exeDir, ConfigFile),
	}
}

// startup is called when the launcher starts
func (l *Launcher) startup(ctx context.Context) {
	l.ctx = ctx
	fmt.Println("[Launcher] Starting CV Manager Launcher v" + LauncherVersion)

	// Load configuration
	l.loadConfig()

	// Check if data location is configured
	if l.config.DataLocation == "" {
		fmt.Println("[Launcher] No data location configured, will prompt user")
	} else {
		fmt.Println("[Launcher] Data location:", l.config.DataLocation)
	}
}

// shutdown is called when the launcher closes
func (l *Launcher) shutdown(ctx context.Context) {
	fmt.Println("[Launcher] Shutting down")
	l.saveConfig()
}

// loadConfig loads launcher configuration
func (l *Launcher) loadConfig() {
	l.config = &LauncherConfig{
		AutoUpdate:      true,
		LauncherVersion: LauncherVersion,
	}

	data, err := os.ReadFile(l.configPath)
	if err != nil {
		fmt.Println("[Launcher] No config file found, using defaults")
		return
	}

	if err := json.Unmarshal(data, l.config); err != nil {
		fmt.Printf("[Launcher] Error parsing config: %v\n", err)
		return
	}

	fmt.Println("[Launcher] Config loaded successfully")
}

// saveConfig saves launcher configuration
func (l *Launcher) saveConfig() error {
	data, err := json.MarshalIndent(l.config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(l.configPath, data, 0644)
}

// GetLauncherInfo returns launcher information
func (l *Launcher) GetLauncherInfo() map[string]interface{} {
	return map[string]interface{}{
		"version":       LauncherVersion,
		"build_date":    LauncherBuildDate,
		"data_location": l.config.DataLocation,
		"auto_update":   l.config.AutoUpdate,
	}
}

// GetDataLocation returns current data location
func (l *Launcher) GetDataLocation() string {
	return l.config.DataLocation
}

// GetFullConfig returns the full config for the frontend
func (l *Launcher) GetFullConfig() map[string]interface{} {
	return map[string]interface{}{
		"data_location":        l.config.DataLocation,
		"auto_update":          l.config.AutoUpdate,
		"launcher_version":     l.config.LauncherVersion,
		"app_version":          l.config.AppVersion,
		"onboarding_completed": l.config.OnboardingCompleted,
	}
}

// MarkOnboardingCompleted marks onboarding as done
func (l *Launcher) MarkOnboardingCompleted() error {
	fmt.Println("[Launcher] Marking onboarding as completed")
	l.config.OnboardingCompleted = true
	return l.saveConfig()
}

// SaveOnboardingData saves user data from onboarding wizard
func (l *Launcher) SaveOnboardingData(data OnboardingData) error {
	fmt.Printf("[Launcher] Saving onboarding data: %+v\n", data)

	// Save onboarding data to a file in the data directory
	if l.config.DataLocation == "" {
		return fmt.Errorf("data location not configured")
	}

	onboardingPath := filepath.Join(l.config.DataLocation, "onboarding.json")
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal onboarding data: %v", err)
	}

	if err := os.WriteFile(onboardingPath, jsonData, 0644); err != nil {
		return fmt.Errorf("failed to save onboarding data: %v", err)
	}

	fmt.Printf("[Launcher] Onboarding data saved to: %s\n", onboardingPath)
	return nil
}

// ResetConfig resets all configuration
func (l *Launcher) ResetConfig() error {
	fmt.Println("[Launcher] Resetting configuration")

	// Reset config to defaults
	l.config = &LauncherConfig{
		AutoUpdate:      true,
		LauncherVersion: LauncherVersion,
	}

	// Delete config file
	if err := os.Remove(l.configPath); err != nil && !os.IsNotExist(err) {
		fmt.Printf("[Launcher] Warning: could not delete config file: %v\n", err)
	}

	// Save empty config
	return l.saveConfig()
}

// SetDataLocation sets and creates the data directory
func (l *Launcher) SetDataLocation(path string) error {
	fmt.Printf("[Launcher] Setting data location to: %s\n", path)

	// Expand ~ to home directory if needed
	if path[:2] == "~/" || path[:2] == "~\\" {
		home, _ := os.UserHomeDir()
		path = filepath.Join(home, path[2:])
	}

	// Create directory if it doesn't exist
	if err := os.MkdirAll(path, 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %v", err)
	}

	// Create subdirectories
	subdirs := []string{"database", "exports", "backups", "logs"}
	for _, dir := range subdirs {
		subPath := filepath.Join(path, dir)
		if err := os.MkdirAll(subPath, 0755); err != nil {
			return fmt.Errorf("failed to create subdirectory %s: %v", dir, err)
		}
	}

	l.config.DataLocation = path
	l.dataPath = path

	// Save config immediately
	if err := l.saveConfig(); err != nil {
		return fmt.Errorf("failed to save config: %v", err)
	}

	fmt.Println("[Launcher] Data location configured successfully")
	return nil
}

// SelectDataLocationDialog shows folder picker dialog
func (l *Launcher) SelectDataLocationDialog() (string, error) {
	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)

	path, err := runtime.OpenDirectoryDialog(l.ctx, runtime.OpenDialogOptions{
		Title:            "Wähle Speicherort für Deine Daten",
		DefaultDirectory: exeDir,
	})

	if err != nil {
		return "", err
	}

	if path == "" {
		return "", fmt.Errorf("no directory selected")
	}

	return path, nil
}

// UseDefaultDataLocation uses exe directory as data location
func (l *Launcher) UseDefaultDataLocation() error {
	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)
	dataPath := filepath.Join(exeDir, "cv-data")

	return l.SetDataLocation(dataPath)
}

// CheckForUpdates checks for updates for both launcher and main app
func (l *Launcher) CheckForUpdates() (map[string]*UpdateStatus, error) {
	fmt.Println("[Launcher] Checking for updates...")

	results := make(map[string]*UpdateStatus)

	// Check launcher update
	launcherStatus, err := l.checkComponentUpdate("launcher", LauncherVersionURL, LauncherVersion)
	if err != nil {
		fmt.Printf("[Launcher] Error checking launcher update: %v\n", err)
		launcherStatus = &UpdateStatus{
			Component:      "launcher",
			CurrentVersion: LauncherVersion,
			Error:          err.Error(),
		}
	}
	results["launcher"] = launcherStatus

	// Check main app update
	appVersion := l.getInstalledAppVersion()
	appStatus, err := l.checkComponentUpdate("app", AppVersionURL, appVersion)
	if err != nil {
		fmt.Printf("[Launcher] Error checking app update: %v\n", err)
		appStatus = &UpdateStatus{
			Component:      "app",
			CurrentVersion: appVersion,
			Error:          err.Error(),
		}
	}
	results["app"] = appStatus

	// Update last check time
	l.config.LastUpdateCheck = time.Now()
	l.saveConfig()

	return results, nil
}

// GitHubContentResponse represents the GitHub API response for file contents
type GitHubContentResponse struct {
	Content  string `json:"content"`
	Encoding string `json:"encoding"`
}

// checkComponentUpdate checks for a single component update
func (l *Launcher) checkComponentUpdate(component, versionURL, currentVersion string) (*UpdateStatus, error) {
	fmt.Printf("[Launcher] Checking %s update from: %s\n", component, versionURL)

	status := &UpdateStatus{
		Component:      component,
		CurrentVersion: currentVersion,
		Checking:       true,
	}

	// Fetch version info from GitHub with shorter timeout (5s to avoid UI hanging)
	client := &http.Client{Timeout: 5 * time.Second}
	fmt.Printf("[Launcher] Sending HTTP GET request...\n")

	resp, err := client.Get(versionURL)
	if err != nil {
		fmt.Printf("[Launcher] HTTP GET failed: %v\n", err)
		status.Checking = false
		status.Error = fmt.Sprintf("Netzwerkfehler: %v", err)
		return status, err
	}
	defer resp.Body.Close()

	fmt.Printf("[Launcher] HTTP response status: %d\n", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		status.Checking = false
		status.Error = fmt.Sprintf("Server-Fehler (Status %d)", resp.StatusCode)
		return status, fmt.Errorf("server returned status %d", resp.StatusCode)
	}

	fmt.Printf("[Launcher] Parsing JSON response...\n")

	// Parse GitHub API response (base64-encoded content)
	var ghContent GitHubContentResponse
	if err := json.NewDecoder(resp.Body).Decode(&ghContent); err != nil {
		fmt.Printf("[Launcher] JSON parsing failed: %v\n", err)
		status.Checking = false
		status.Error = fmt.Sprintf("Fehler beim Lesen der API-Antwort: %v", err)
		return status, err
	}

	// Decode base64 content
	decodedContent, err := base64.StdEncoding.DecodeString(ghContent.Content)
	if err != nil {
		fmt.Printf("[Launcher] Base64 decoding failed: %v\n", err)
		status.Checking = false
		status.Error = fmt.Sprintf("Fehler beim Dekodieren: %v", err)
		return status, err
	}

	// Parse the actual version info
	var updateInfo UpdateInfo
	if err := json.Unmarshal(decodedContent, &updateInfo); err != nil {
		fmt.Printf("[Launcher] Version JSON parsing failed: %v\n", err)
		status.Checking = false
		status.Error = fmt.Sprintf("Fehler beim Lesen der Update-Info: %v", err)
		return status, err
	}

	fmt.Printf("[Launcher] Update info parsed successfully: v%s\n", updateInfo.LatestVersion)

	status.Checking = false
	status.LatestVersion = updateInfo.LatestVersion
	status.ReleaseNotes = updateInfo.ReleaseNotes
	status.ReleaseDate = updateInfo.ReleaseDate
	status.CommitHash = updateInfo.CommitHash
	status.DownloadURL = updateInfo.DownloadURL
	status.SHA256 = updateInfo.SHA256
	status.SizeMB = updateInfo.SizeMB
	status.IsRequired = updateInfo.IsRequired

	// Compare versions
	if updateInfo.LatestVersion != currentVersion {
		status.UpdateAvailable = true
		fmt.Printf("[Launcher] ✅ Update available for %s: %s -> %s\n", component, currentVersion, updateInfo.LatestVersion)
	} else {
		status.UpdateAvailable = false
		fmt.Printf("[Launcher] ✅ %s is up to date: %s\n", component, currentVersion)
	}

	return status, nil
}

// getInstalledAppVersion reads the main app version
func (l *Launcher) getInstalledAppVersion() string {
	// Check if main app exists
	if _, err := os.Stat(l.mainAppPath); os.IsNotExist(err) {
		return "not-installed"
	}

	// Try to read version from app's version file or metadata
	// For now, return from config
	if l.config.AppVersion != "" {
		return l.config.AppVersion
	}

	return "unknown"
}

// DownloadUpdate downloads an update
func (l *Launcher) DownloadUpdate(component, downloadURL, expectedSHA256 string) (*DownloadProgress, error) {
	fmt.Printf("[Launcher] Downloading %s from: %s\n", component, downloadURL)

	progress := &DownloadProgress{
		Component: component,
		Status:    "downloading",
	}

	// Create HTTP client
	client := &http.Client{Timeout: 10 * time.Minute}

	// Download file
	resp, err := client.Get(downloadURL)
	if err != nil {
		progress.Status = "error"
		progress.Error = fmt.Sprintf("Failed to download: %v", err)
		return progress, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		progress.Status = "error"
		progress.Error = fmt.Sprintf("Download failed with status %d", resp.StatusCode)
		return progress, fmt.Errorf("download failed with status %d", resp.StatusCode)
	}

	// Get content length
	progress.TotalBytes = resp.ContentLength

	// Create temp file
	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)
	updatesDir := filepath.Join(exeDir, "updates")
	os.MkdirAll(updatesDir, 0755)

	tempFile := filepath.Join(updatesDir, component+"-update.exe")
	out, err := os.Create(tempFile)
	if err != nil {
		progress.Status = "error"
		progress.Error = fmt.Sprintf("Failed to create temp file: %v", err)
		return progress, err
	}
	defer out.Close()

	// Download with progress tracking
	hash := sha256.New()
	multiWriter := io.MultiWriter(out, hash)

	startTime := time.Now()
	written, err := io.Copy(multiWriter, resp.Body)
	if err != nil {
		progress.Status = "error"
		progress.Error = fmt.Sprintf("Download interrupted: %v", err)
		os.Remove(tempFile)
		return progress, err
	}

	duration := time.Since(startTime).Seconds()
	progress.BytesDownloaded = written
	progress.PercentComplete = 100
	progress.SpeedMBps = float64(written) / duration / 1024 / 1024

	// Verify SHA256
	progress.Status = "verifying"
	downloadedHash := hex.EncodeToString(hash.Sum(nil))
	if expectedSHA256 != "" && downloadedHash != expectedSHA256 {
		progress.Status = "error"
		progress.Error = "SHA256 verification failed - file may be corrupted"
		os.Remove(tempFile)
		return progress, fmt.Errorf("SHA256 verification failed")
	}

	progress.Status = "complete"
	fmt.Printf("[Launcher] Download complete: %s\n", tempFile)
	fmt.Printf("[Launcher] SHA256 verified: %s\n", downloadedHash)

	return progress, nil
}

// ApplyUpdate installs a downloaded update and saves the new version
func (l *Launcher) ApplyUpdate(component string) error {
	return l.ApplyUpdateWithVersion(component, "")
}

// ApplyUpdateWithVersion installs a downloaded update with version tracking
func (l *Launcher) ApplyUpdateWithVersion(component, newVersion string) error {
	fmt.Printf("[Launcher] Applying update for: %s (version: %s)\n", component, newVersion)

	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)
	updatesDir := filepath.Join(exeDir, "updates")
	updateFile := filepath.Join(updatesDir, component+"-update.exe")

	// Check if update file exists
	if _, err := os.Stat(updateFile); os.IsNotExist(err) {
		return fmt.Errorf("update file not found: %s", updateFile)
	}

	// Determine target file
	var targetFile string
	if component == "launcher" {
		targetFile = l.launcherPath
	} else if component == "app" {
		targetFile = l.mainAppPath
	} else {
		return fmt.Errorf("unknown component: %s", component)
	}

	// Create backup
	backupFile := targetFile + ".backup"
	if _, err := os.Stat(targetFile); err == nil {
		if err := os.Rename(targetFile, backupFile); err != nil {
			return fmt.Errorf("failed to backup current version: %v", err)
		}
	}

	// Copy new version
	if err := copyFile(updateFile, targetFile); err != nil {
		// Restore backup on failure
		if _, err := os.Stat(backupFile); err == nil {
			os.Rename(backupFile, targetFile)
		}
		return fmt.Errorf("failed to apply update: %v", err)
	}

	// Remove update file
	os.Remove(updateFile)

	// Save version to config
	if newVersion != "" {
		if component == "app" {
			l.config.AppVersion = newVersion
		} else if component == "launcher" {
			l.config.LauncherVersion = newVersion
		}
		l.saveConfig()
	}

	fmt.Printf("[Launcher] Update applied successfully! Backup: %s\n", backupFile)
	return nil
}

// LaunchMainApp starts the main application
func (l *Launcher) LaunchMainApp() error {
	fmt.Println("[Launcher] Launching main application...")

	// Check if main app exists
	if _, err := os.Stat(l.mainAppPath); os.IsNotExist(err) {
		return fmt.Errorf("main application not found: %s", l.mainAppPath)
	}

	// Set environment variable with data path
	env := os.Environ()
	env = append(env, "CV_MANAGER_DATA_PATH="+l.config.DataLocation)

	// Start main app
	cmd := exec.Command(l.mainAppPath)
	cmd.Env = env
	cmd.Dir = filepath.Dir(l.mainAppPath)

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start main application: %v", err)
	}

	fmt.Println("[Launcher] Main application started successfully")
	return nil
}

// copyFile copies a file from src to dst
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
}

// GetLatestRelease fetches the latest release info from GitHub API
func (l *Launcher) GetLatestRelease() (*ReleaseInfo, error) {
	fmt.Println("[Launcher] Fetching latest release from GitHub...")

	client := &http.Client{Timeout: 5 * time.Second}

	// Fetch latest release
	resp, err := client.Get(GitHubReleasesAPI + "/latest")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch release: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("failed to parse release: %v", err)
	}

	// Parse release notes into changes list
	changes := parseReleaseNotes(release.Body)

	info := &ReleaseInfo{
		Version:      release.TagName,
		ReleaseDate:  release.PublishedAt,
		ReleaseNotes: release.Body,
		ChangelogURL: release.HTMLURL,
		Changes:      changes,
	}

	fmt.Printf("[Launcher] Latest release: %s\n", release.TagName)
	return info, nil
}

// GetRecentCommits fetches recent commits from GitHub
func (l *Launcher) GetRecentCommits(limit int) ([]GitHubCommit, error) {
	fmt.Printf("[Launcher] Fetching last %d commits from GitHub...\n", limit)

	client := &http.Client{Timeout: 5 * time.Second}

	url := fmt.Sprintf("%s?per_page=%d", GitHubCommitsAPI, limit)
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch commits: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var commits []GitHubCommit
	if err := json.NewDecoder(resp.Body).Decode(&commits); err != nil {
		return nil, fmt.Errorf("failed to parse commits: %v", err)
	}

	fmt.Printf("[Launcher] Fetched %d commits\n", len(commits))
	return commits, nil
}

// GetGitHubStatus returns the current connection status to GitHub
func (l *Launcher) GetGitHubStatus() map[string]interface{} {
	result := map[string]interface{}{
		"connected":   false,
		"repo":        GitHubOwner + "/" + GitHubRepo,
		"branch":      GitHubBranch,
		"releases_url": "https://github.com/" + GitHubOwner + "/" + GitHubRepo + "/releases",
	}

	// Quick ping to check connectivity
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Head("https://api.github.com")
	if err == nil && resp.StatusCode == http.StatusOK {
		result["connected"] = true
	}

	return result
}

// parseReleaseNotes splits release notes into individual changes
func parseReleaseNotes(body string) []string {
	var changes []string
	lines := splitLines(body)

	for _, line := range lines {
		line = trimSpace(line)
		if len(line) < 2 {
			continue
		}
		// Look for bullet points or numbered items
		runes := []rune(line)
		if runes[0] == '-' || runes[0] == '*' || runes[0] == '•' {
			changes = append(changes, trimSpace(string(runes[1:])))
		}
	}

	return changes
}

// splitLines splits a string into lines
func splitLines(s string) []string {
	var lines []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			lines = append(lines, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}

// trimSpace trims whitespace from a string
func trimSpace(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\r') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\r') {
		end--
	}
	return s[start:end]
}
