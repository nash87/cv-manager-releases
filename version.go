package main

import (
	"fmt"
	"time"
)

// Version information - automatically incremented on build
const (
	MajorVersion = 1
	MinorVersion = 1
	PatchVersion = 0
)

// BuildInfo contains build-time information
type BuildInfo struct {
	Version     string    `json:"version"`
	BuildTime   string    `json:"build_time"`
	BuildNumber int       `json:"build_number"`
	GitCommit   string    `json:"git_commit"`
	GitBranch   string    `json:"git_branch"`
}

// These variables are set at build time using ldflags
var (
	BuildTime   = "unknown"
	BuildNumber = "0"
	GitCommit   = "unknown"
	GitBranch   = "main"
)

// GetVersion returns the full version string
func GetVersion() string {
	return fmt.Sprintf("%d.%d.%d", MajorVersion, MinorVersion, PatchVersion)
}

// GetFullVersion returns version with build number
func GetFullVersion() string {
	return fmt.Sprintf("%d.%d.%d+%s", MajorVersion, MinorVersion, PatchVersion, BuildNumber)
}

// GetBuildInfo returns complete build information
func GetBuildInfo() BuildInfo {
	buildNum := 0
	fmt.Sscanf(BuildNumber, "%d", &buildNum)

	return BuildInfo{
		Version:     GetFullVersion(),
		BuildTime:   BuildTime,
		BuildNumber: buildNum,
		GitCommit:   GitCommit,
		GitBranch:   GitBranch,
	}
}

// GetChangeLog returns the changelog entries
func GetChangeLog() []ChangeLogEntry {
	return []ChangeLogEntry{
		{
			Version:     "1.1.0",
			Date:        "2025-12-26",
			Description: "Automatic repair and migration system",
			Changes: []string{
				"Added automatic database repair on startup",
				"Implemented version migration system",
				"Added splash screen with version information",
				"Implemented update history module",
				"Added Git integration for automatic versioning",
				"Implemented Gitea backup integration",
				"Fixed Visual Editor PDF loading issue",
				"Fixed BadgerDB encryption configuration",
				"Improved portable data storage (all data next to EXE)",
			},
		},
		{
			Version:     "1.0.0",
			Date:        "2025-12-25",
			Description: "Initial Release",
			Changes: []string{
				"CV management with encryption (AES-256-GCM)",
				"GDPR compliance with consent management",
				"Statistics view with Chart.js visualizations",
				"Job Applications tracking with timeline",
				"Template management system",
				"Visual PDF editor with real-time preview",
				"Category and tag organization",
				"Compliance logging (Art. 6(1)(a) GDPR)",
				"Offline-first portable application",
			},
		},
	}
}

// ChangeLogEntry represents a version changelog
type ChangeLogEntry struct {
	Version     string    `json:"version"`
	Date        string    `json:"date"`
	Description string    `json:"description"`
	Changes     []string  `json:"changes"`
	Timestamp   time.Time `json:"timestamp,omitempty"`
}

// CompareVersions compares two version strings
// Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
func CompareVersions(v1, v2 string) int {
	var major1, minor1, patch1, major2, minor2, patch2 int

	fmt.Sscanf(v1, "%d.%d.%d", &major1, &minor1, &patch1)
	fmt.Sscanf(v2, "%d.%d.%d", &major2, &minor2, &patch2)

	if major1 != major2 {
		if major1 < major2 {
			return -1
		}
		return 1
	}

	if minor1 != minor2 {
		if minor1 < minor2 {
			return -1
		}
		return 1
	}

	if patch1 != patch2 {
		if patch1 < patch2 {
			return -1
		}
		return 1
	}

	return 0
}

// IsNewerVersion checks if v1 is newer than v2
func IsNewerVersion(v1, v2 string) bool {
	return CompareVersions(v1, v2) > 0
}
