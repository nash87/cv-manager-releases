//go:build ignore

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// ChangeLogEntry represents a changelog entry
type ChangeLogEntry struct {
	Version     string   `json:"version"`
	Date        string   `json:"date"`
	Description string   `json:"description"`
	Changes     []string `json:"changes"`
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: extract-changelog <version>")
		os.Exit(1)
	}
	targetVersion := os.Args[1]

	// Read version.go and extract changelog
	// For simplicity, we'll use a JSON file approach
	changelog := getChangelog()

	for _, entry := range changelog {
		if entry.Version == targetVersion {
			fmt.Printf("## %s\n\n", entry.Description)
			fmt.Println("### Changes:")
			for _, change := range entry.Changes {
				fmt.Printf("- %s\n", change)
			}
			return
		}
	}

	// Fallback if version not found
	fmt.Println("New release with improvements and bug fixes.")
}

func getChangelog() []ChangeLogEntry {
	// Try to read from changelog.json if exists
	data, err := os.ReadFile("changelog.json")
	if err == nil {
		var entries []ChangeLogEntry
		if json.Unmarshal(data, &entries) == nil {
			return entries
		}
	}

	// Fallback: parse from version.go (simplified)
	content, err := os.ReadFile("version.go")
	if err != nil {
		return nil
	}

	// Very basic parsing - look for ChangeLogEntry blocks
	lines := strings.Split(string(content), "\n")
	var entries []ChangeLogEntry
	var current *ChangeLogEntry
	var inChanges bool

	for _, line := range lines {
		line = strings.TrimSpace(line)

		if strings.Contains(line, "Version:") && strings.Contains(line, "\"") {
			if current != nil {
				entries = append(entries, *current)
			}
			current = &ChangeLogEntry{}
			start := strings.Index(line, "\"") + 1
			end := strings.LastIndex(line, "\"")
			if start > 0 && end > start {
				current.Version = line[start:end]
			}
		} else if current != nil && strings.Contains(line, "Date:") {
			start := strings.Index(line, "\"") + 1
			end := strings.LastIndex(line, "\"")
			if start > 0 && end > start {
				current.Date = line[start:end]
			}
		} else if current != nil && strings.Contains(line, "Description:") {
			start := strings.Index(line, "\"") + 1
			end := strings.LastIndex(line, "\"")
			if start > 0 && end > start {
				current.Description = line[start:end]
			}
		} else if current != nil && strings.Contains(line, "Changes:") {
			inChanges = true
		} else if inChanges && strings.HasPrefix(line, "\"") {
			start := strings.Index(line, "\"") + 1
			end := strings.LastIndex(line, "\"")
			if start > 0 && end > start {
				current.Changes = append(current.Changes, line[start:end])
			}
		} else if inChanges && strings.Contains(line, "},") {
			inChanges = false
		}
	}

	if current != nil {
		entries = append(entries, *current)
	}

	return entries
}
