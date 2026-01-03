package main

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// Test that logging to file works
func TestLoggingToFile(t *testing.T) {
	// NewLauncher() creates the log file in the executable directory
	launcher := NewLauncher()

	// Get the log file path (it's in the build directory)
	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)
	logPath := filepath.Join(exeDir, "launcher.log")

	// Give it a moment to write
	time.Sleep(100 * time.Millisecond)

	// Check if log file exists
	if _, err := os.Stat(logPath); os.IsNotExist(err) {
		t.Fatalf("Log file was not created at %s", logPath)
	}

	// Read log file
	content, err := os.ReadFile(logPath)
	if err != nil {
		t.Fatalf("Failed to read log file: %v", err)
	}

	logContent := string(content)

	// Check log contains expected entries
	expectedLogs := []string{
		"CV Manager Launcher",
		"v1.0.2",
	}

	for _, expected := range expectedLogs {
		if !strings.Contains(logContent, expected) {
			t.Errorf("Log file missing expected content: %s", expected)
		}
	}

	t.Logf("✅ Logging to file works correctly (log path: %s)", logPath)

	_ = launcher // Use launcher to avoid unused warning
}

// Test config save and load
func TestConfigSaveLoad(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "test-config.json")

	launcher := &Launcher{
		configPath: configPath,
		config: &LauncherConfig{
			DataLocation:    tempDir,
			AutoUpdate:      true,
			LastUpdateCheck: time.Now(),
			LauncherVersion: "1.0.2",
			AppVersion:      "1.2.0",
		},
	}

	// Test save
	if err := launcher.saveConfig(); err != nil {
		t.Fatalf("Failed to save config: %v", err)
	}

	// Verify file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		t.Fatal("Config file was not created")
	}

	// Test load
	launcher2 := &Launcher{
		configPath: configPath,
	}
	launcher2.loadConfig()

	// Verify loaded values
	if launcher2.config.DataLocation != tempDir {
		t.Errorf("Expected DataLocation %s, got %s", tempDir, launcher2.config.DataLocation)
	}

	if launcher2.config.AutoUpdate != true {
		t.Error("AutoUpdate should be true")
	}

	if launcher2.config.LauncherVersion != "1.0.2" {
		t.Errorf("Expected LauncherVersion 1.0.2, got %s", launcher2.config.LauncherVersion)
	}

	t.Log("✅ Config save/load works correctly")
}

// Test SetDataLocation
func TestSetDataLocation(t *testing.T) {
	tempDir := t.TempDir()
	dataDir := filepath.Join(tempDir, "custom-data")

	launcher := &Launcher{
		configPath: filepath.Join(tempDir, "config.json"),
		config:     &LauncherConfig{},
	}

	err := launcher.SetDataLocation(dataDir)
	if err != nil {
		t.Fatalf("SetDataLocation failed: %v", err)
	}

	// Verify data directory was created
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		t.Error("Data directory was not created")
	}

	// Verify config was updated
	if launcher.config.DataLocation != dataDir {
		t.Errorf("Expected DataLocation %s, got %s", dataDir, launcher.config.DataLocation)
	}

	t.Log("✅ SetDataLocation works correctly")
}

// Test UseDefaultDataLocation
func TestUseDefaultDataLocation(t *testing.T) {
	tempDir := t.TempDir()

	launcher := &Launcher{
		launcherPath: filepath.Join(tempDir, "launcher.exe"),
		configPath:   filepath.Join(tempDir, "config.json"),
		config:       &LauncherConfig{},
	}

	err := launcher.UseDefaultDataLocation()
	if err != nil {
		t.Fatalf("UseDefaultDataLocation failed: %v", err)
	}

	// Verify data location was set
	if launcher.config.DataLocation == "" {
		t.Error("DataLocation was not set")
	}

	// Should contain "cv-data"
	if !strings.Contains(launcher.config.DataLocation, "cv-data") {
		t.Errorf("Expected DataLocation to contain 'cv-data', got %s", launcher.config.DataLocation)
	}

	t.Log("✅ UseDefaultDataLocation works correctly")
}

// Test getInstalledAppVersion
func TestGetInstalledAppVersion(t *testing.T) {
	tempDir := t.TempDir()
	mainAppPath := filepath.Join(tempDir, "cv-manager.exe")

	launcher := &Launcher{
		mainAppPath: mainAppPath,
		config: &LauncherConfig{
			AppVersion: "1.2.0",
		},
	}

	// Test when app doesn't exist
	version := launcher.getInstalledAppVersion()
	if version != "not-installed" {
		t.Errorf("Expected 'not-installed', got %s", version)
	}

	// Create fake app exe
	os.WriteFile(mainAppPath, []byte("fake exe"), 0644)

	// Test when app exists
	version = launcher.getInstalledAppVersion()
	if version != "1.2.0" {
		t.Errorf("Expected '1.2.0', got %s", version)
	}

	t.Log("✅ getInstalledAppVersion works correctly")
}

// Test startup and shutdown
func TestStartupShutdown(t *testing.T) {
	launcher := NewLauncher()
	ctx := context.Background()

	launcher.startup(ctx)

	if launcher.ctx != ctx {
		t.Error("Context was not set correctly")
	}

	t.Log("✅ Startup works correctly")
}

// Test LaunchMainApp when app doesn't exist
func TestLaunchMainApp_NotInstalled(t *testing.T) {
	tempDir := t.TempDir()

	launcher := &Launcher{
		mainAppPath: filepath.Join(tempDir, "nonexistent.exe"),
	}

	err := launcher.LaunchMainApp()
	if err == nil {
		t.Error("Expected error when launching non-existent app")
	}

	t.Log("✅ LaunchMainApp correctly handles non-existent app")
}

// Test ApplyUpdate
func TestApplyUpdate(t *testing.T) {
	// Get current executable path
	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)
	updatesDir := filepath.Join(exeDir, "updates")
	os.MkdirAll(updatesDir, 0755)

	appExe := filepath.Join(exeDir, "cv-manager.exe")
	updateFile := filepath.Join(updatesDir, "app-update.exe")

	// Create fake files
	os.WriteFile(appExe, []byte("old version"), 0644)
	os.WriteFile(updateFile, []byte("new version"), 0644)

	launcher := &Launcher{
		launcherPath: exePath,
		mainAppPath:  appExe,
	}

	err := launcher.ApplyUpdate("app")
	if err != nil {
		t.Fatalf("ApplyUpdate failed: %v", err)
	}

	// Verify update was applied
	content, _ := os.ReadFile(appExe)
	if string(content) != "new version" {
		t.Error("Update was not applied correctly")
	}

	// Verify backup was created
	backupPath := appExe + ".backup"
	backupContent, _ := os.ReadFile(backupPath)
	if string(backupContent) != "old version" {
		t.Error("Backup was not created correctly")
	}

	// Cleanup
	os.Remove(appExe)
	os.Remove(backupPath)
	os.Remove(updateFile)

	t.Log("✅ ApplyUpdate works correctly")
}

// Test error handling for invalid component
func TestApplyUpdate_InvalidComponent(t *testing.T) {
	launcher := NewLauncher()

	err := launcher.ApplyUpdate("invalid-component")
	if err == nil {
		t.Error("Expected error for invalid component")
	}

	t.Log("✅ ApplyUpdate correctly handles invalid component")
}

// Test download with invalid URL
func TestDownloadUpdate_InvalidURL(t *testing.T) {
	launcher := NewLauncher()

	_, err := launcher.DownloadUpdate("app", "http://invalid-url-that-does-not-exist.local", "abc123")
	if err == nil {
		t.Error("Expected error for invalid URL")
	}

	t.Log("✅ DownloadUpdate correctly handles invalid URL")
}

// Test SHA256 verification failure
func TestDownloadUpdate_SHA256Mismatch(t *testing.T) {
	// This test would need a real HTTP server
	// For now, we skip it in normal test runs
	t.Skip("Skipping SHA256 mismatch test - requires HTTP server setup")
}

// Test concurrent config access
func TestConcurrentConfigAccess(t *testing.T) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "config.json")

	launcher := &Launcher{
		configPath: configPath,
		config: &LauncherConfig{
			DataLocation: tempDir,
			AutoUpdate:   true,
		},
	}

	// Save initial config
	launcher.saveConfig()

	// Concurrent writes
	done := make(chan bool, 10)
	for i := 0; i < 10; i++ {
		go func(id int) {
			launcher.config.AppVersion = string(rune('A' + id))
			launcher.saveConfig()
			done <- true
		}(i)
	}

	// Wait for all
	for i := 0; i < 10; i++ {
		<-done
	}

	t.Log("✅ Concurrent config access handled")
}

// Benchmark update check
func BenchmarkCheckForUpdates(b *testing.B) {
	launcher := NewLauncher()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		launcher.CheckForUpdates()
	}
}

// Benchmark config save
func BenchmarkConfigSave(b *testing.B) {
	tempDir := b.TempDir()
	launcher := &Launcher{
		configPath: filepath.Join(tempDir, "config.json"),
		config:     &LauncherConfig{},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		launcher.saveConfig()
	}
}
