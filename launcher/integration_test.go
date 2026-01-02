// +build integration

package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"
)

// Integration test that tests the full launcher flow
func TestFullLauncherFlow(t *testing.T) {
	// Create temp directory for test
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "launcher-config.json")

	t.Logf("Test directory: %s", tempDir)

	// Create launcher
	launcher := &Launcher{
		ctx:          context.Background(),
		launcherPath: filepath.Join(tempDir, "cv-manager-launcher.exe"),
		mainAppPath:  filepath.Join(tempDir, "cv-manager-pro.exe"),
		configPath:   configPath,
		config: &LauncherConfig{
			DataLocation:    tempDir,
			AutoUpdate:      true,
			LastUpdateCheck: time.Time{},
			LauncherVersion: LauncherVersion,
			AppVersion:      "",
		},
	}

	// Test 1: GetLauncherInfo
	t.Run("GetLauncherInfo", func(t *testing.T) {
		info := launcher.GetLauncherInfo()

		version := info["version"].(string)
		if version != LauncherVersion {
			t.Errorf("Expected version %s, got %s", LauncherVersion, version)
		}

		buildDate := info["build_date"].(string)
		t.Logf("✅ Launcher info: v%s, build %s", version, buildDate)
	})

	// Test 2: CheckForUpdates
	t.Run("CheckForUpdates", func(t *testing.T) {
		t.Log("Starting update check...")

		start := time.Now()
		updates, err := launcher.CheckForUpdates()
		duration := time.Since(start)

		if err != nil {
			t.Fatalf("CheckForUpdates failed: %v", err)
		}

		t.Logf("Update check completed in %v", duration)

		// Check launcher status
		if launcherStatus, ok := updates["launcher"]; ok {
			t.Logf("Launcher status: current=%s, latest=%s, available=%v",
				launcherStatus.CurrentVersion,
				launcherStatus.LatestVersion,
				launcherStatus.UpdateAvailable)

			if launcherStatus.Error != "" {
				t.Errorf("Launcher update check has error: %s", launcherStatus.Error)
			}
		} else {
			t.Error("No launcher status in results")
		}

		// Check app status
		if appStatus, ok := updates["app"]; ok {
			t.Logf("App status: current=%s, latest=%s, available=%v",
				appStatus.CurrentVersion,
				appStatus.LatestVersion,
				appStatus.UpdateAvailable)

			if appStatus.Error != "" {
				t.Errorf("App update check has error: %s", appStatus.Error)
			}
		} else {
			t.Error("No app status in results")
		}

		// Save results to file
		resultsFile := filepath.Join(tempDir, "update-check-results.json")
		data, _ := json.MarshalIndent(updates, "", "  ")
		os.WriteFile(resultsFile, data, 0644)
		t.Logf("Results saved to: %s", resultsFile)
	})

	// Test 3: UseDefaultDataLocation
	t.Run("UseDefaultDataLocation", func(t *testing.T) {
		err := launcher.UseDefaultDataLocation()
		if err != nil {
			t.Fatalf("UseDefaultDataLocation failed: %v", err)
		}

		if launcher.config.DataLocation == "" {
			t.Error("Data location not set")
		}

		t.Logf("✅ Data location: %s", launcher.config.DataLocation)
	})

	t.Log("✅ All integration tests passed!")
}

// Test concurrent update checks
func TestConcurrentUpdateChecks(t *testing.T) {
	launcher := NewLauncher()

	numConcurrent := 5
	done := make(chan bool, numConcurrent)
	errors := make(chan error, numConcurrent)

	t.Logf("Running %d concurrent update checks...", numConcurrent)

	for i := 0; i < numConcurrent; i++ {
		go func(id int) {
			t.Logf("Goroutine %d: Starting update check", id)
			start := time.Now()

			_, err := launcher.CheckForUpdates()

			if err != nil {
				errors <- err
			} else {
				t.Logf("Goroutine %d: Completed in %v", id, time.Since(start))
			}

			done <- true
		}(i)
	}

	// Wait for all to complete
	for i := 0; i < numConcurrent; i++ {
		<-done
	}

	close(errors)

	// Check for errors
	for err := range errors {
		t.Errorf("Concurrent test error: %v", err)
	}

	t.Log("✅ All concurrent update checks completed!")
}
