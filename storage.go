package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// CVStorage handles CV persistence
type CVStorage struct {
	storageDir string
	indexFile  string
	cvs        map[string]*CV
}

// NewCVStorage creates a new storage instance
func NewCVStorage(baseDir string) (*CVStorage, error) {
	storageDir := filepath.Join(baseDir, "cvs")
	if err := os.MkdirAll(storageDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory: %w", err)
	}

	storage := &CVStorage{
		storageDir: storageDir,
		indexFile:  filepath.Join(storageDir, "index.json"),
		cvs:        make(map[string]*CV),
	}

	if err := storage.loadIndex(); err != nil {
		return nil, err
	}

	return storage, nil
}

// Index structure
type index struct {
	CVIDs []string `json:"cv_ids"`
}

// loadIndex loads the CV index
func (s *CVStorage) loadIndex() error {
	if _, err := os.Stat(s.indexFile); os.IsNotExist(err) {
		// Create empty index
		return s.saveIndex()
	}

	data, err := os.ReadFile(s.indexFile)
	if err != nil {
		return fmt.Errorf("failed to read index: %w", err)
	}

	var idx index
	if err := json.Unmarshal(data, &idx); err != nil {
		return fmt.Errorf("failed to parse index: %w", err)
	}

	// Load all CVs
	for _, id := range idx.CVIDs {
		cv, err := s.LoadCV(id)
		if err != nil {
			fmt.Printf("Warning: failed to load CV %s: %v\n", id, err)
			continue
		}
		s.cvs[id] = cv
	}

	return nil
}

// saveIndex saves the CV index
func (s *CVStorage) saveIndex() error {
	ids := make([]string, 0, len(s.cvs))
	for id := range s.cvs {
		ids = append(ids, id)
	}

	idx := index{CVIDs: ids}
	data, err := json.MarshalIndent(idx, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal index: %w", err)
	}

	if err := os.WriteFile(s.indexFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write index: %w", err)
	}

	return nil
}

// CreateCV creates a new CV
func (s *CVStorage) CreateCV() (*CV, error) {
	cv := NewCV()
	if err := s.SaveCV(cv); err != nil {
		return nil, err
	}
	return cv, nil
}

// SaveCV saves a CV to disk
func (s *CVStorage) SaveCV(cv *CV) error {
	cv.UpdatedAt = time.Now()

	data, err := json.MarshalIndent(cv, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal CV: %w", err)
	}

	cvFile := filepath.Join(s.storageDir, cv.ID+".json")
	if err := os.WriteFile(cvFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write CV file: %w", err)
	}

	s.cvs[cv.ID] = cv

	return s.saveIndex()
}

// LoadCV loads a CV from disk
func (s *CVStorage) LoadCV(id string) (*CV, error) {
	cvFile := filepath.Join(s.storageDir, id+".json")

	data, err := os.ReadFile(cvFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read CV file: %w", err)
	}

	var cv CV
	if err := json.Unmarshal(data, &cv); err != nil {
		return nil, fmt.Errorf("failed to parse CV: %w", err)
	}

	return &cv, nil
}

// DeleteCV deletes a CV
func (s *CVStorage) DeleteCV(id string) error {
	cvFile := filepath.Join(s.storageDir, id+".json")

	if err := os.Remove(cvFile); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete CV file: %w", err)
	}

	delete(s.cvs, id)

	return s.saveIndex()
}

// GetAllCVs returns all CVs
func (s *CVStorage) GetAllCVs() []*CV {
	cvs := make([]*CV, 0, len(s.cvs))
	for _, cv := range s.cvs {
		cvs = append(cvs, cv)
	}
	return cvs
}

// GetAllSummaries returns CV summaries for dashboard
func (s *CVStorage) GetAllSummaries() []CVSummary {
	summaries := make([]CVSummary, 0, len(s.cvs))
	for _, cv := range s.cvs {
		summaries = append(summaries, cv.ToSummary())
	}
	return summaries
}

// SearchCVs searches CVs by query
func (s *CVStorage) SearchCVs(query string) []*CV {
	query = strings.ToLower(query)
	results := make([]*CV, 0)

	for _, cv := range s.cvs {
		// Search in basic fields
		if strings.Contains(strings.ToLower(cv.Firstname), query) ||
			strings.Contains(strings.ToLower(cv.Lastname), query) ||
			strings.Contains(strings.ToLower(cv.JobTitle), query) ||
			strings.Contains(strings.ToLower(cv.TargetJob), query) ||
			strings.Contains(strings.ToLower(cv.TargetCompany), query) ||
			strings.Contains(strings.ToLower(cv.Email), query) {
			results = append(results, cv)
			continue
		}

		// Search in work experience
		found := false
		for _, work := range cv.WorkExperience {
			if strings.Contains(strings.ToLower(work.Company), query) ||
				strings.Contains(strings.ToLower(work.Position), query) {
				results = append(results, cv)
				found = true
				break
			}
		}
		if found {
			continue
		}

		// Search in tags
		for _, tag := range cv.Tags {
			if strings.Contains(strings.ToLower(tag), query) {
				results = append(results, cv)
				break
			}
		}
	}

	return results
}

// FilterCVs filters CVs by criteria
func (s *CVStorage) FilterCVs(tags []string, category, status, template string) []*CV {
	results := make([]*CV, 0)

	for _, cv := range s.cvs {
		match := true

		// Filter by tags
		if len(tags) > 0 {
			tagMatch := false
			for _, filterTag := range tags {
				for _, cvTag := range cv.Tags {
					if cvTag == filterTag {
						tagMatch = true
						break
					}
				}
				if tagMatch {
					break
				}
			}
			if !tagMatch {
				match = false
			}
		}

		// Filter by category
		if category != "" && cv.Category != category {
			match = false
		}

		// Filter by status
		if status != "" && cv.Status != status {
			match = false
		}

		// Filter by template
		if template != "" && cv.Template != template {
			match = false
		}

		if match {
			results = append(results, cv)
		}
	}

	return results
}

// GetStatistics calculates CV statistics
func (s *CVStorage) GetStatistics() Statistics {
	stats := Statistics{
		TotalCVs:       len(s.cvs),
		StatusCounts:   make(map[string]int),
		CategoryCounts: make(map[string]int),
		TemplateCounts: make(map[string]int),
		AllTags:        make([]string, 0),
	}

	tagSet := make(map[string]bool)
	totalWork := 0
	totalEdu := 0
	totalSkills := 0

	for _, cv := range s.cvs {
		// Count by status
		stats.StatusCounts[cv.Status]++

		// Count by category
		if cv.Category != "" {
			stats.CategoryCounts[cv.Category]++
		}

		// Count by template
		stats.TemplateCounts[cv.Template]++

		// Collect tags
		for _, tag := range cv.Tags {
			tagSet[tag] = true
		}

		// Count entries
		totalWork += len(cv.WorkExperience)
		totalEdu += len(cv.Education)
		totalSkills += len(cv.Skills)
	}

	// Convert tag set to slice
	for tag := range tagSet {
		stats.AllTags = append(stats.AllTags, tag)
	}

	// Calculate totals and averages
	stats.TotalWorkExperience = totalWork
	stats.TotalEducation = totalEdu
	stats.TotalSkills = totalSkills

	if stats.TotalCVs > 0 {
		stats.AvgWorkPerCV = float64(totalWork) / float64(stats.TotalCVs)
		stats.AvgEducationPerCV = float64(totalEdu) / float64(stats.TotalCVs)
		stats.AvgSkillsPerCV = float64(totalSkills) / float64(stats.TotalCVs)
	}

	return stats
}

// DuplicateCV duplicates an existing CV
func (s *CVStorage) DuplicateCV(id string) (*CV, error) {
	original, exists := s.cvs[id]
	if !exists {
		return nil, fmt.Errorf("CV not found: %s", id)
	}

	// Create a deep copy
	data, err := json.Marshal(original)
	if err != nil {
		return nil, err
	}

	var duplicate CV
	if err := json.Unmarshal(data, &duplicate); err != nil {
		return nil, err
	}

	// Update metadata
	duplicate.ID = NewCV().ID
	duplicate.CreatedAt = time.Now()
	duplicate.UpdatedAt = time.Now()

	if err := s.SaveCV(&duplicate); err != nil {
		return nil, err
	}

	return &duplicate, nil
}

// GetAllTags returns all unique tags
func (s *CVStorage) GetAllTags() []string {
	tagSet := make(map[string]bool)
	for _, cv := range s.cvs {
		for _, tag := range cv.Tags {
			tagSet[tag] = true
		}
	}

	tags := make([]string, 0, len(tagSet))
	for tag := range tagSet {
		tags = append(tags, tag)
	}

	return tags
}

// GetAllCategories returns all unique categories
func (s *CVStorage) GetAllCategories() []string {
	catSet := make(map[string]bool)
	for _, cv := range s.cvs {
		if cv.Category != "" {
			catSet[cv.Category] = true
		}
	}

	categories := make([]string, 0, len(catSet))
	for cat := range catSet {
		categories = append(categories, cat)
	}

	return categories
}
