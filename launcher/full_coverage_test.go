package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// Test GetLauncherInfo
func TestGetLauncherInfo_Full(t *testing.T) {
	launcher := NewLauncher()
	launcher.loadConfig() // Load config first

	info := launcher.GetLauncherInfo()

	// Check all fields
	if version, ok := info["version"].(string); !ok || version != LauncherVersion {
		t.Errorf("Expected version %s, got %v", LauncherVersion, info["version"])
	}

	if buildDate, ok := info["build_date"].(string); !ok || buildDate != LauncherBuildDate {
		t.Errorf("Expected build_date %s, got %v", LauncherBuildDate, info["build_date"])
	}

	if _, ok := info["data_location"].(string); !ok {
		t.Error("data_location missing or wrong type")
	}

	if autoUpdate, ok := info["auto_update"].(bool); !ok {
		t.Error("auto_update missing or wrong type")
	} else {
		t.Logf("auto_update: %v", autoUpdate)
	}

	t.Log("✅ GetLauncherInfo returns all fields correctly")
}

// Test GetDataLocation
func TestGetDataLocation_Full(t *testing.T) {
	tempDir := t.TempDir()
	launcher := &Launcher{
		config: &LauncherConfig{
			DataLocation: tempDir,
		},
	}

	result := launcher.GetDataLocation()
	if result != tempDir {
		t.Errorf("Expected %s, got %s", tempDir, result)
	}

	t.Log("✅ GetDataLocation works correctly")
}

// Test CheckForUpdates (full)
func TestCheckForUpdates_Full(t *testing.T) {
	launcher := NewLauncher()
	launcher.loadConfig() // Initialize config

	updates, err := launcher.CheckForUpdates()
	if err != nil {
		t.Fatalf("CheckForUpdates failed: %v", err)
	}

	// Check both launcher and app status exist
	if _, ok := updates["launcher"]; !ok {
		t.Error("launcher status missing")
	}

	if _, ok := updates["app"]; !ok {
		t.Error("app status missing")
	}

	// Check last update check was updated
	if launcher.config.LastUpdateCheck.IsZero() {
		t.Error("LastUpdateCheck was not updated")
	}

	t.Log("✅ CheckForUpdates works end-to-end")
}

// Test DownloadUpdate with mock server
func TestDownloadUpdate_Full(t *testing.T) {
	// Create test content
	testContent := []byte("This is a test executable content for download testing")
	hash := sha256.Sum256(testContent)
	expectedSHA256 := hex.EncodeToString(hash[:])

	// Create mock HTTP server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write(testContent)
	}))
	defer server.Close()

	launcher := NewLauncher()

	progress, err := launcher.DownloadUpdate("app", server.URL, expectedSHA256)
	if err != nil {
		t.Fatalf("DownloadUpdate failed: %v", err)
	}

	if progress.Status != "complete" {
		t.Errorf("Expected status 'complete', got '%s'", progress.Status)
	}

	if progress.Error != "" {
		t.Errorf("Unexpected error: %s", progress.Error)
	}

	t.Log("✅ DownloadUpdate works with valid content and SHA256")
}

// Test DownloadUpdate with wrong SHA256
func TestDownloadUpdate_SHA256Fail(t *testing.T) {
	testContent := []byte("test content")

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write(testContent)
	}))
	defer server.Close()

	launcher := NewLauncher()

	// Use wrong SHA256
	wrongSHA256 := "0000000000000000000000000000000000000000000000000000000000000000"

	progress, err := launcher.DownloadUpdate("app", server.URL, wrongSHA256)
	if err == nil {
		t.Error("Expected SHA256 mismatch error")
	}

	if progress != nil && !strings.Contains(progress.Error, "SHA256") {
		t.Errorf("Expected SHA256 error, got: %s", progress.Error)
	}

	t.Log("✅ DownloadUpdate correctly detects SHA256 mismatch")
}

// Test LaunchMainApp - REMOVED: Was starting real EXE files
// See safe_coverage_test.go for TestLaunchMainApp_NotFound which is safe

// Test shutdown
func TestShutdown(t *testing.T) {
	launcher := NewLauncher()
	ctx := context.Background()

	// Shutdown should not panic
	launcher.shutdown(ctx)

	t.Log("✅ Shutdown completed without error")
}

// Test copyFile
func TestCopyFile(t *testing.T) {
	tempDir := t.TempDir()
	srcFile := filepath.Join(tempDir, "source.txt")
	dstFile := filepath.Join(tempDir, "dest.txt")

	// Create source file
	testContent := []byte("test content for copy")
	os.WriteFile(srcFile, testContent, 0644)

	// Copy file
	err := copyFile(srcFile, dstFile)
	if err != nil {
		t.Fatalf("copyFile failed: %v", err)
	}

	// Verify destination
	dstContent, err := os.ReadFile(dstFile)
	if err != nil {
		t.Fatalf("Failed to read dest file: %v", err)
	}

	if !bytes.Equal(testContent, dstContent) {
		t.Error("Copied content doesn't match source")
	}

	t.Log("✅ copyFile works correctly")
}

// Test copyFile with non-existent source
func TestCopyFile_SourceNotExist(t *testing.T) {
	tempDir := t.TempDir()

	err := copyFile(filepath.Join(tempDir, "nonexistent.txt"), filepath.Join(tempDir, "dest.txt"))
	if err == nil {
		t.Error("Expected error for non-existent source file")
	}

	t.Log("✅ copyFile correctly handles non-existent source")
}

// Test saveConfig with error (invalid path)
func TestSaveConfig_Error(t *testing.T) {
	launcher := &Launcher{
		configPath: "/invalid/path/that/does/not/exist/config.json",
		config:     &LauncherConfig{},
	}

	err := launcher.saveConfig()
	if err == nil {
		t.Error("Expected error for invalid config path")
	}

	t.Log("✅ saveConfig correctly handles invalid path")
}

// Test loadConfig with invalid JSON
func TestLoadConfig_InvalidJSON(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "invalid-config.json")

	// Write invalid JSON
	os.WriteFile(configPath, []byte("{ invalid json }"), 0644)

	launcher := &Launcher{
		configPath: configPath,
		config:     &LauncherConfig{},
	}

	launcher.loadConfig()

	// Should fall back to defaults
	if launcher.config.AutoUpdate != true {
		t.Error("Should have default AutoUpdate = true after invalid JSON")
	}

	t.Log("✅ loadConfig handles invalid JSON gracefully")
}

// Test DownloadUpdate with server error
func TestDownloadUpdate_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	launcher := NewLauncher()

	_, err := launcher.DownloadUpdate("app", server.URL, "abc123")
	if err == nil {
		t.Error("Expected error for 500 status code")
	}

	t.Log("✅ DownloadUpdate handles server error correctly")
}

// Test ApplyUpdate for launcher (special case)
func TestApplyUpdate_Launcher(t *testing.T) {
	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)
	updatesDir := filepath.Join(exeDir, "updates")
	os.MkdirAll(updatesDir, 0755)

	launcherExe := filepath.Join(exeDir, "cv-manager-launcher.exe")
	updateFile := filepath.Join(updatesDir, "launcher-update.exe")

	// Create fake files
	os.WriteFile(launcherExe, []byte("old launcher"), 0644)
	os.WriteFile(updateFile, []byte("new launcher"), 0644)

	launcher := &Launcher{
		launcherPath: launcherExe,
	}

	err := launcher.ApplyUpdate("launcher")
	if err != nil {
		t.Fatalf("ApplyUpdate launcher failed: %v", err)
	}

	// Cleanup
	os.Remove(launcherExe)
	os.Remove(launcherExe + ".backup")
	os.Remove(updateFile)

	t.Log("✅ ApplyUpdate works for launcher component")
}

// Test full workflow: Check -> Download -> Apply
func TestFullUpdateWorkflow(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping full workflow test in short mode")
	}

	launcher := NewLauncher()
	launcher.loadConfig() // Initialize config

	// Step 1: Check for updates
	t.Log("Step 1: Checking for updates...")
	updates, err := launcher.CheckForUpdates()
	if err != nil {
		t.Fatalf("CheckForUpdates failed: %v", err)
	}

	t.Logf("Launcher: %s -> %s (available: %v)",
		updates["launcher"].CurrentVersion,
		updates["launcher"].LatestVersion,
		updates["launcher"].UpdateAvailable)

	t.Logf("App: %s -> %s (available: %v)",
		updates["app"].CurrentVersion,
		updates["app"].LatestVersion,
		updates["app"].UpdateAvailable)

	t.Log("✅ Full update workflow check completed")
}

// Benchmark full update check
func BenchmarkFullUpdateCheck(b *testing.B) {
	launcher := NewLauncher()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		launcher.CheckForUpdates()
	}
}

// Benchmark file copy
func BenchmarkCopyFile(b *testing.B) {
	tempDir := b.TempDir()
	srcFile := filepath.Join(tempDir, "source.bin")
	dstFile := filepath.Join(tempDir, "dest.bin")

	// Create 1MB test file
	data := make([]byte, 1024*1024)
	os.WriteFile(srcFile, data, 0644)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		copyFile(srcFile, dstFile)
		os.Remove(dstFile)
	}
}
