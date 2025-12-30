package main

import (
	"fmt"
	"time"
)

// Version information - automatically incremented on build
const (
	MajorVersion = 1
	MinorVersion = 2
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
			Version:     "1.2.0",
			Date:        "2025-12-30",
			Description: "Comprehensive Audit System & UI Enhancements",
			Changes: []string{
				"🔍 NEW: Complete Audit Log system for tracking all user activities",
				"📊 NEW: Audit statistics dashboard with real-time metrics",
				"🎨 NEW: UnoCSS framework integration with Obsidian-inspired design",
				"🎯 NEW: Phosphor SVG icon system (30+ icons)",
				"🌍 NEW: Extended i18n support (German/English)",
				"📝 NEW: Advanced audit filtering (date range, event type, category, status)",
				"💾 NEW: Encrypted audit log storage in BadgerDB",
				"📈 NEW: Change tracking for CV updates (before/after values)",
				"🔄 NEW: Audit event export functionality",
				"⚡ IMPROVED: Robust error handling with utils.js",
				"🐛 FIX: Critical 'undefined' error in frontend error handling",
				"✨ ENHANCED: All CV operations now logged with detailed metadata",
			},
		},
		{
			Version:     "1.1.6",
			Date:        "2025-12-26",
			Description: "New productivity features",
			Changes: []string{
				"Added bulk delete functionality for multiple CVs",
				"Implemented favorites system to mark important CVs",
				"Added get favorites function to filter favorite CVs",
				"Improved CV management workflow",
				"Performance optimizations for large datasets",
			},
		},
		{
			Version:     "1.1.5",
			Date:        "2025-12-26",
			Description: "Auto-update system stabilization",
			Changes: []string{
				"Fixed auto-update check reliability",
				"Improved startup sequence",
				"Enhanced error handling during updates",
				"Better logging for update process",
			},
		},
		{
			Version:     "1.1.4",
			Date:        "2025-12-26",
			Description: "Automatic silent updates (Discord-style)",
			Changes: []string{
				"Implemented automatic update check on startup",
				"Silent background download of updates",
				"Automatic installation on next app start",
				"Fixed nil pointer crashes during startup",
				"Update check now runs during splash screen",
				"Added green dot indicator when update is ready",
			},
		},
		{
			Version:     "1.1.3",
			Date:        "2025-12-26",
			Description: "Window controls, footer, and UI polish",
			Changes: []string{
				"Added custom titlebar with minimize/maximize/close buttons",
				"Added footer with version and copyright",
				"Improved exit button styling",
				"Fixed onboarding error handling",
				"Applied Obsidian-style UI (compact, smaller fonts)",
				"Fixed version loading in Updates view",
			},
		},
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
