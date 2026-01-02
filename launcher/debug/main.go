package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

const (
	GitHubOwner        = "nash87"
	GitHubRepo         = "cv-manager-pro-releases"
	GitHubBranch       = "main"
	AppVersionURL      = "https://raw.githubusercontent.com/" + GitHubOwner + "/" + GitHubRepo + "/" + GitHubBranch + "/version.json"
	LauncherVersionURL = "https://raw.githubusercontent.com/" + GitHubOwner + "/" + GitHubRepo + "/" + GitHubBranch + "/launcher-version.json"
)

type UpdateInfo struct {
	LatestVersion string `json:"latest_version"`
	ReleaseDate   string `json:"release_date"`
	DownloadURL   string `json:"download_url"`
	ChangelogURL  string `json:"changelog_url"`
	ReleaseNotes  string `json:"release_notes"`
	SHA256        string `json:"sha256"`
	SizeMB        int    `json:"size_mb"`
	IsRequired    bool   `json:"is_required"`
}

func main() {
	fmt.Println("=== CV Manager Launcher - Debug Tool ===")

	// Setup logging
	logFile, err := os.Create("launcher-debug.log")
	if err == nil {
		defer logFile.Close()
		multiWriter := io.MultiWriter(os.Stdout, logFile)
		log.SetOutput(multiWriter)
	}

	log.Println("Step 1: Testing network connectivity...")
	if !testNetworkConnectivity() {
		log.Fatal("❌ Network connectivity test failed!")
	}
	log.Println("✅ Network connectivity OK")

	log.Println("Step 2: Testing Launcher version URL...")
	if err := testUpdateURL("Launcher", LauncherVersionURL); err != nil {
		log.Printf("❌ Launcher URL test failed: %v\n", err)
	} else {
		log.Println("✅ Launcher URL test OK")
	}

	log.Println("Step 3: Testing App version URL...")
	if err := testUpdateURL("App", AppVersionURL); err != nil {
		log.Printf("❌ App URL test failed: %v\n", err)
	} else {
		log.Println("✅ App URL test OK")
	}

	log.Println("\n=== All tests completed! ===")
	log.Println("Check launcher-debug.log for details")
}

func testNetworkConnectivity() bool {
	log.Println("  Pinging google.com...")
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("https://www.google.com")
	if err != nil {
		log.Printf("  ❌ Failed to ping google.com: %v\n", err)
		return false
	}
	defer resp.Body.Close()
	log.Printf("  ✅ Google.com responded: %d\n", resp.StatusCode)
	return true
}

func testUpdateURL(component, url string) error {
	log.Printf("  Testing URL: %s\n", url)

	client := &http.Client{Timeout: 30 * time.Second}

	start := time.Now()
	log.Printf("  [%s] Sending HTTP GET request...\n", time.Now().Format("15:04:05"))

	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("HTTP GET failed after %v: %w", time.Since(start), err)
	}
	defer resp.Body.Close()

	log.Printf("  [%s] Response received after %v\n", time.Now().Format("15:04:05"), time.Since(start))
	log.Printf("  HTTP Status: %d\n", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server returned status %d", resp.StatusCode)
	}

	// Read body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	log.Printf("  Response size: %d bytes\n", len(body))

	// Parse JSON
	var updateInfo UpdateInfo
	if err := json.Unmarshal(body, &updateInfo); err != nil {
		log.Printf("  Raw response: %s\n", string(body))
		return fmt.Errorf("failed to parse JSON: %w", err)
	}

	log.Printf("  ✅ %s Update Info:\n", component)
	log.Printf("     Version: %s\n", updateInfo.LatestVersion)
	log.Printf("     Download: %s\n", updateInfo.DownloadURL)
	log.Printf("     Size: %d MB\n", updateInfo.SizeMB)
	log.Printf("     SHA256: %s\n", updateInfo.SHA256)

	return nil
}
