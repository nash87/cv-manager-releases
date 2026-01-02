package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

const (
	UpdateCheckURL = "https://raw.githubusercontent.com/nash87/cv-manager-pro-releases/main/version.json"
	UpdateTimeout  = 5 * time.Second // Reduced timeout to avoid UI hanging
)

// AppUpdateInfo contains information about available updates (main app specific)
type AppUpdateInfo struct {
	LatestVersion  string `json:"latest_version"`
	ReleaseDate    string `json:"release_date"`
	DownloadURL    string `json:"download_url"`
	ChangelogURL   string `json:"changelog_url"`
	MinimumVersion string `json:"minimum_version"`
	ReleaseNotes   string `json:"release_notes"`
	SHA256         string `json:"sha256"`
	SizeMB         int    `json:"size_mb"`
}

// AppUpdateStatus represents the current update check status for main app
type AppUpdateStatus struct {
	Checking        bool   `json:"checking"`
	UpdateAvailable bool   `json:"update_available"`
	CurrentVersion  string `json:"current_version"`
	LatestVersion   string `json:"latest_version"`
	ReleaseNotes    string `json:"release_notes"`
	DownloadURL     string `json:"download_url"`
	ChangelogURL    string `json:"changelog_url"`
	SHA256          string `json:"sha256"`
	Error           string `json:"error"`
	SizeMB          int    `json:"size_mb"`
}

// AppDownloadProgress tracks update download progress for main app
type AppDownloadProgress struct {
	Downloading     bool   `json:"downloading"`
	BytesDownloaded int64  `json:"bytes_downloaded"`
	TotalBytes      int64  `json:"total_bytes"`
	PercentComplete int    `json:"percent_complete"`
	Error           string `json:"error"`
}

// CheckForUpdates checks if a new version is available on GitHub
func (a *App) CheckForUpdates() (*AppUpdateStatus, error) {
	status := &AppUpdateStatus{
		Checking:       true,
		CurrentVersion: GetVersion(),
	}

	fmt.Printf("[Updater] Checking for updates... Current version: %s\n", status.CurrentVersion)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: UpdateTimeout,
	}

	// Fetch version.json from GitHub
	resp, err := client.Get(UpdateCheckURL)
	if err != nil {
		status.Checking = false
		status.Error = fmt.Sprintf("Failed to check for updates: %v", err)
		fmt.Printf("[Updater] Error: %v\n", err)
		return status, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		status.Checking = false
		status.Error = fmt.Sprintf("Update server returned status %d", resp.StatusCode)
		fmt.Printf("[Updater] HTTP error: %d\n", resp.StatusCode)
		return status, fmt.Errorf("update server returned status %d", resp.StatusCode)
	}

	// Parse version.json
	var updateInfo AppUpdateInfo
	if err := json.NewDecoder(resp.Body).Decode(&updateInfo); err != nil {
		status.Checking = false
		status.Error = fmt.Sprintf("Failed to parse update info: %v", err)
		fmt.Printf("[Updater] Parse error: %v\n", err)
		return status, err
	}

	status.Checking = false
	status.LatestVersion = updateInfo.LatestVersion
	status.ReleaseNotes = updateInfo.ReleaseNotes
	status.DownloadURL = updateInfo.DownloadURL
	status.ChangelogURL = updateInfo.ChangelogURL
	status.SHA256 = updateInfo.SHA256
	status.SizeMB = updateInfo.SizeMB

	// Compare versions using version.go helper
	if IsNewerVersion(updateInfo.LatestVersion, status.CurrentVersion) {
		status.UpdateAvailable = true
		fmt.Printf("[Updater] Update available: %s -> %s\n", status.CurrentVersion, status.LatestVersion)
	} else {
		status.UpdateAvailable = false
		fmt.Printf("[Updater] Already on latest version: %s\n", status.CurrentVersion)
	}

	return status, nil
}

// DownloadUpdate downloads the new version from GitHub
func (a *App) DownloadUpdate(downloadURL string, expectedSHA256 string) (*AppDownloadProgress, error) {
	progress := &AppDownloadProgress{
		Downloading: true,
	}

	fmt.Printf("[Updater] Downloading update from: %s\n", downloadURL)

	// Create HTTP client with longer timeout for downloads
	client := &http.Client{
		Timeout: 5 * time.Minute,
	}

	// Download file
	resp, err := client.Get(downloadURL)
	if err != nil {
		progress.Downloading = false
		progress.Error = fmt.Sprintf("Failed to download update: %v", err)
		return progress, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		progress.Downloading = false
		progress.Error = fmt.Sprintf("Download failed with status %d", resp.StatusCode)
		return progress, fmt.Errorf("download failed with status %d", resp.StatusCode)
	}

	// Get content length
	progress.TotalBytes = resp.ContentLength
	fmt.Printf("[Updater] Download size: %d bytes (%.2f MB)\n", progress.TotalBytes, float64(progress.TotalBytes)/1024/1024)

	// Create temp file
	tempDir := os.TempDir()
	tempFile := filepath.Join(tempDir, "cv-manager-pro-update.exe")
	out, err := os.Create(tempFile)
	if err != nil {
		progress.Downloading = false
		progress.Error = fmt.Sprintf("Failed to create temp file: %v", err)
		return progress, err
	}
	defer out.Close()

	// Download with progress tracking
	hash := sha256.New()
	multiWriter := io.MultiWriter(out, hash)

	written, err := io.Copy(multiWriter, resp.Body)
	if err != nil {
		progress.Downloading = false
		progress.Error = fmt.Sprintf("Download interrupted: %v", err)
		os.Remove(tempFile)
		return progress, err
	}

	progress.BytesDownloaded = written
	progress.PercentComplete = 100
	progress.Downloading = false

	// Verify SHA256
	downloadedHash := hex.EncodeToString(hash.Sum(nil))
	if expectedSHA256 != "" && downloadedHash != expectedSHA256 {
		progress.Error = "SHA256 verification failed - file may be corrupted"
		os.Remove(tempFile)
		fmt.Printf("[Updater] SHA256 mismatch! Expected: %s, Got: %s\n", expectedSHA256, downloadedHash)
		return progress, fmt.Errorf("SHA256 verification failed")
	}

	fmt.Printf("[Updater] Download complete: %s\n", tempFile)
	fmt.Printf("[Updater] SHA256 verified: %s\n", downloadedHash)

	return progress, nil
}

// ApplyUpdate replaces the current executable with the downloaded update
func (a *App) ApplyUpdate() error {
	tempFile := filepath.Join(os.TempDir(), "cv-manager-pro-update.exe")

	// Check if update file exists
	if _, err := os.Stat(tempFile); os.IsNotExist(err) {
		return fmt.Errorf("update file not found: %s", tempFile)
	}

	// Get current executable path
	currentExe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get current executable path: %v", err)
	}

	// Create backup of current version
	backupFile := currentExe + ".backup"
	if err := os.Rename(currentExe, backupFile); err != nil {
		return fmt.Errorf("failed to backup current version: %v", err)
	}

	// Copy new version to current location
	if err := copyUpdateFile(tempFile, currentExe); err != nil {
		// Restore backup on failure
		os.Rename(backupFile, currentExe)
		return fmt.Errorf("failed to apply update: %v", err)
	}

	// Remove temp file
	os.Remove(tempFile)

	fmt.Printf("[Updater] Update applied successfully! Backup: %s\n", backupFile)
	fmt.Println("[Updater] Please restart the application to use the new version")

	return nil
}

// GetUpdateDownloadPath returns the path to the downloaded update file
func (a *App) GetUpdateDownloadPath() string {
	return filepath.Join(os.TempDir(), "cv-manager-pro-update.exe")
}

// copyUpdateFile copies a file from src to dst (separate function to avoid conflict with migration.go)
func copyUpdateFile(src, dst string) error {
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
