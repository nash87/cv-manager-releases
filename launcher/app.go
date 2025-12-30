package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
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
	DataLocation    string    `json:"data_location"`    // Where user data is stored
	AutoUpdate      bool      `json:"auto_update"`      // Auto-update enabled
	LastUpdateCheck time.Time `json:"last_update_check"`
	LauncherVersion string    `json:"launcher_version"`
	AppVersion      string    `json:"app_version"`
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
}

// UpdateStatus represents current update status
type UpdateStatus struct {
	Component         string `json:"component"`          // "launcher" or "app"
	CurrentVersion    string `json:"current_version"`
	LatestVersion     string `json:"latest_version"`
	UpdateAvailable   bool   `json:"update_available"`
	IsRequired        bool   `json:"is_required"`
	ReleaseNotes      string `json:"release_notes"`
	DownloadURL       string `json:"download_url"`
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

const (
	LauncherVersion      = "1.0.0"
	LauncherBuildDate    = "2025-12-30"

	GitHubOwner          = "nash87"
	GitHubRepo           = "cv-manager-pro-releases"
	GitHubBranch         = "main"

	AppVersionURL        = "https://raw.githubusercontent.com/" + GitHubOwner + "/" + GitHubRepo + "/" + GitHubBranch + "/version.json"
	LauncherVersionURL   = "https://raw.githubusercontent.com/" + GitHubOwner + "/" + GitHubRepo + "/" + GitHubBranch + "/launcher-version.json"

	MainAppExecutable    = "cv-manager-pro.exe"
	LauncherExecutable   = "cv-manager-launcher.exe"
	ConfigFile           = "launcher-config.json"
)

// NewLauncher creates a new launcher instance
func NewLauncher() *Launcher {
	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)

	return &Launcher{
		launcherPath: exePath,
		mainAppPath:  filepath.Join(exeDir, MainAppExecutable),
		configPath:   filepath.Join(exeDir, ConfigFile),
	}
}

// startup is called when the launcher starts
func (l *Launcher) startup(ctx context.Context) {
	l.ctx = ctx
	fmt.Println("[Launcher] Starting CV Manager Pro Launcher v" + LauncherVersion)

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

// checkComponentUpdate checks for a single component update
func (l *Launcher) checkComponentUpdate(component, versionURL, currentVersion string) (*UpdateStatus, error) {
	status := &UpdateStatus{
		Component:      component,
		CurrentVersion: currentVersion,
		Checking:       true,
	}

	// Fetch version info from GitHub
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(versionURL)
	if err != nil {
		status.Checking = false
		status.Error = fmt.Sprintf("Failed to fetch update info: %v", err)
		return status, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		status.Checking = false
		status.Error = fmt.Sprintf("Server returned status %d", resp.StatusCode)
		return status, fmt.Errorf("server returned status %d", resp.StatusCode)
	}

	var updateInfo UpdateInfo
	if err := json.NewDecoder(resp.Body).Decode(&updateInfo); err != nil {
		status.Checking = false
		status.Error = fmt.Sprintf("Failed to parse update info: %v", err)
		return status, err
	}

	status.Checking = false
	status.LatestVersion = updateInfo.LatestVersion
	status.ReleaseNotes = updateInfo.ReleaseNotes
	status.DownloadURL = updateInfo.DownloadURL
	status.SizeMB = updateInfo.SizeMB
	status.IsRequired = updateInfo.IsRequired

	// Compare versions
	if updateInfo.LatestVersion != currentVersion {
		status.UpdateAvailable = true
		fmt.Printf("[Launcher] Update available for %s: %s -> %s\n", component, currentVersion, updateInfo.LatestVersion)
	} else {
		status.UpdateAvailable = false
		fmt.Printf("[Launcher] %s is up to date: %s\n", component, currentVersion)
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

// ApplyUpdate installs a downloaded update
func (l *Launcher) ApplyUpdate(component string) error {
	fmt.Printf("[Launcher] Applying update for: %s\n", component)

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
