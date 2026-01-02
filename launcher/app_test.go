package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// Test HTTP request to GitHub
func TestCheckComponentUpdate_Success(t *testing.T) {
	// Mock GitHub response
	mockResponse := UpdateInfo{
		LatestVersion: "1.2.0",
		ReleaseDate:   "2025-12-30",
		DownloadURL:   "https://example.com/app.exe",
		ReleaseNotes:  "Test release",
		SHA256:        "abc123",
		SizeMB:        16,
		IsRequired:    false,
	}

	// Create test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Logf("Test server received request: %s", r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mockResponse)
	}))
	defer server.Close()

	// Create launcher
	launcher := NewLauncher()

	// Test update check
	status, err := launcher.checkComponentUpdate("app", server.URL, "1.0.0")

	if err != nil {
		t.Fatalf("checkComponentUpdate failed: %v", err)
	}

	if status.LatestVersion != "1.2.0" {
		t.Errorf("Expected version 1.2.0, got %s", status.LatestVersion)
	}

	if !status.UpdateAvailable {
		t.Error("Expected update to be available")
	}

	t.Logf("✅ Test passed: Update check successful")
}

// Test timeout scenario
func TestCheckComponentUpdate_Timeout(t *testing.T) {
	// Create slow server (35 seconds delay - longer than 30s timeout)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Logf("Test server: Simulating slow response...")
		time.Sleep(35 * time.Second)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	launcher := NewLauncher()

	start := time.Now()
	_, err := launcher.checkComponentUpdate("app", server.URL, "1.0.0")
	duration := time.Since(start)

	if err == nil {
		t.Error("Expected timeout error, got nil")
	}

	if duration > 35*time.Second {
		t.Errorf("Expected timeout after ~30s, but took %v", duration)
	}

	t.Logf("✅ Test passed: Timeout after %v", duration)
}

// Test real GitHub URLs
func TestCheckComponentUpdate_RealGitHub(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping real GitHub test in short mode")
	}

	launcher := NewLauncher()

	t.Log("Testing real GitHub URL: " + AppVersionURL)

	status, err := launcher.checkComponentUpdate("app", AppVersionURL, "0.0.1")

	if err != nil {
		t.Fatalf("Real GitHub test failed: %v", err)
	}

	t.Logf("✅ Latest version from GitHub: %s", status.LatestVersion)
	t.Logf("✅ Download URL: %s", status.DownloadURL)
	t.Logf("✅ Update available: %v", status.UpdateAvailable)
}

// Test invalid JSON response
func TestCheckComponentUpdate_InvalidJSON(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("invalid json {{{"))
	}))
	defer server.Close()

	launcher := NewLauncher()
	_, err := launcher.checkComponentUpdate("app", server.URL, "1.0.0")

	if err == nil {
		t.Error("Expected JSON parse error, got nil")
	}

	t.Logf("✅ Test passed: Invalid JSON handled correctly")
}

// Test 404 response
func TestCheckComponentUpdate_NotFound(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	launcher := NewLauncher()
	_, err := launcher.checkComponentUpdate("app", server.URL, "1.0.0")

	if err == nil {
		t.Error("Expected 404 error, got nil")
	}

	t.Logf("✅ Test passed: 404 handled correctly")
}
