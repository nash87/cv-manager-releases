package main

import (
	"time"

	"github.com/google/uuid"
)

// WorkExperience represents a job/position
type WorkExperience struct {
	ID        string    `json:"id"`
	Position  string    `json:"position"`
	Company   string    `json:"company"`
	Location  string    `json:"location"`
	StartDate string    `json:"start_date"`
	EndDate   string    `json:"end_date"`
	Tasks     []string  `json:"tasks"`
	CreatedAt time.Time `json:"created_at"`
}

// Education represents an education entry
type Education struct {
	ID          string    `json:"id"`
	Degree      string    `json:"degree"`
	Institution string    `json:"institution"`
	StartDate   string    `json:"start_date"`
	EndDate     string    `json:"end_date"`
	GPA         string    `json:"gpa"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// Skill represents a skill with proficiency level
type Skill struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Level    float64 `json:"level"` // 0.0 to 1.0
	Category string  `json:"category"`
}

// Language represents a language with proficiency
type Language struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Level int    `json:"level"` // 1 to 5
}

// CV represents a complete CV/Resume
type CV struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Personal Info
	Firstname  string `json:"firstname"`
	Lastname   string `json:"lastname"`
	JobTitle   string `json:"job_title"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Address    string `json:"address"`
	City       string `json:"city"`
	Country    string `json:"country"`
	PostalCode string `json:"postal_code"`
	LinkedIn   string `json:"linkedin"`
	GitHub     string `json:"github"`
	Website    string `json:"website"`

	// Photo
	PhotoPath string `json:"photo_path"`

	// Summary
	Summary string `json:"summary"`

	// Collections
	WorkExperience []WorkExperience `json:"work_experience"`
	Education      []Education      `json:"education"`
	Skills         []Skill          `json:"skills"`
	Languages      []Language       `json:"languages"`

	// Documents
	Documents []string `json:"documents"`

	// Metadata
	Template      string   `json:"template"`       // modern, classic, creative
	TargetJob     string   `json:"target_job"`     // Target position
	TargetCompany string   `json:"target_company"` // Target company
	Notes         string   `json:"notes"`
	Tags          []string `json:"tags"`
	Category      string   `json:"category"` // IT, Marketing, etc.
	Status        string   `json:"status"`   // draft, ready, submitted, archived
	ColorScheme   string   `json:"color_scheme"`
	Language      string   `json:"language"` // DE or EN

	// Analytics
	ViewCount    int        `json:"view_count"`
	LastViewed   *time.Time `json:"last_viewed"`
	LastExported *time.Time `json:"last_exported"`
	ExportCount  int        `json:"export_count"`

	// User Preferences
	IsFavorite bool `json:"is_favorite"` // Mark CV as favorite for quick access
}

// NewCV creates a new CV with default values
func NewCV() *CV {
	now := time.Now()
	return &CV{
		ID:             uuid.New().String(),
		CreatedAt:      now,
		UpdatedAt:      now,
		Template:       "modern",
		Status:         "draft",
		ColorScheme:    "blue",
		Language:       "DE",
		WorkExperience: []WorkExperience{},
		Education:      []Education{},
		Skills:         []Skill{},
		Languages:      []Language{},
		Documents:      []string{},
		Tags:           []string{},
	}
}

// GetDisplayName returns a display name for the CV
func (cv *CV) GetDisplayName() string {
	name := cv.Firstname + " " + cv.Lastname
	if name == " " {
		name = "Untitled CV"
	}
	if cv.TargetJob != "" {
		name += " - " + cv.TargetJob
	}
	return name
}

// CVSummary for dashboard cards
type CVSummary struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	JobTitle       string    `json:"job_title"`
	Status         string    `json:"status"`
	Category       string    `json:"category"`
	Tags           []string  `json:"tags"`
	TargetJob      string    `json:"target_job"`
	TargetCompany  string    `json:"target_company"`
	UpdatedAt      time.Time `json:"updated_at"`
	WorkCount      int       `json:"work_count"`
	EducationCount int       `json:"education_count"`
	SkillsCount    int       `json:"skills_count"`
	IsFavorite     bool      `json:"is_favorite"` // Favorite status
}

// ToSummary converts CV to CVSummary for dashboard
func (cv *CV) ToSummary() CVSummary {
	return CVSummary{
		ID:             cv.ID,
		Name:           cv.GetDisplayName(),
		JobTitle:       cv.JobTitle,
		Status:         cv.Status,
		Category:       cv.Category,
		Tags:           cv.Tags,
		TargetJob:      cv.TargetJob,
		TargetCompany:  cv.TargetCompany,
		UpdatedAt:      cv.UpdatedAt,
		WorkCount:      len(cv.WorkExperience),
		EducationCount: len(cv.Education),
		SkillsCount:    len(cv.Skills),
		IsFavorite:     cv.IsFavorite,
	}
}

// Statistics represents CV statistics
type Statistics struct {
	TotalCVs            int                `json:"total_cvs"`
	StatusCounts        map[string]int     `json:"status_counts"`
	CategoryCounts      map[string]int     `json:"category_counts"`
	TemplateCounts      map[string]int     `json:"template_counts"`
	AllTags             []string           `json:"all_tags"`
	TotalWorkExperience int                `json:"total_work_experience"`
	TotalEducation      int                `json:"total_education"`
	TotalSkills         int                `json:"total_skills"`
	AvgWorkPerCV        float64            `json:"avg_work_per_cv"`
	AvgEducationPerCV   float64            `json:"avg_education_per_cv"`
	AvgSkillsPerCV      float64            `json:"avg_skills_per_cv"`
}

// ======================== JOB APPLICATION MANAGEMENT ========================

// JobPortal represents a job portal/platform
type JobPortal string

const (
	PortalIndeed     JobPortal = "Indeed"
	PortalLinkedIn   JobPortal = "LinkedIn"
	PortalStepStone  JobPortal = "StepStone"
	PortalXing       JobPortal = "XING"
	PortalGlassdoor  JobPortal = "Glassdoor"
	PortalKununu     JobPortal = "kununu"
	PortalMonsterDE  JobPortal = "Monster.de"
	PortalJobware    JobPortal = "Jobware"
	PortalCompanyWeb JobPortal = "Firmen-Website"
	PortalOther      JobPortal = "Andere"
)

// ApplicationStatus represents the status of a job application
type ApplicationStatus string

const (
	StatusDraft              ApplicationStatus = "draft"               // Not yet submitted
	StatusApplied            ApplicationStatus = "applied"             // Application submitted
	StatusUnderReview        ApplicationStatus = "under_review"        // Application being reviewed
	StatusInterviewScheduled ApplicationStatus = "interview_scheduled" // Interview scheduled
	StatusInterviewed        ApplicationStatus = "interviewed"         // Interview completed
	StatusSecondRound        ApplicationStatus = "second_round"        // Second interview round
	StatusOffer              ApplicationStatus = "offer"               // Job offer received
	StatusAccepted           ApplicationStatus = "accepted"            // Offer accepted
	StatusRejected           ApplicationStatus = "rejected"            // Application rejected
	StatusWithdrawn          ApplicationStatus = "withdrawn"           // Application withdrawn
	StatusNoResponse         ApplicationStatus = "no_response"         // No response from company
)

// TimelineEvent represents an event in the application journey
type TimelineEvent struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"` // applied, interview, feedback, status_change, email, note
	Title     string    `json:"title"`
	Details   string    `json:"details"`
	Timestamp time.Time `json:"timestamp"`
}

// ApplicationFeedback represents feedback from company or own notes
type ApplicationFeedback struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"` // company_response, interview_notes, self_reflection
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Rating    int       `json:"rating"` // 1-5 stars (optional, for own rating of interview etc.)
	Timestamp time.Time `json:"timestamp"`
}

// JobApplication represents a job application with tracking
type JobApplication struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Link to CV used for this application
	CVID       string `json:"cv_id"`
	CVSnapshot string `json:"cv_snapshot"` // Snapshot of CV name at time of application

	// Job Details
	JobTitle       string `json:"job_title"`
	Company        string `json:"company"`
	CompanyWebsite string `json:"company_website"`
	JobDescription string `json:"job_description"`
	Location       string `json:"location"`
	Salary         string `json:"salary"`       // e.g. "50.000 - 70.000 EUR"
	JobType        string `json:"job_type"`     // Full-time, Part-time, Contract, etc.
	Remote         bool   `json:"remote"`       // Remote job?
	Hybrid         bool   `json:"hybrid"`       // Hybrid work?

	// Application Details
	Portal         JobPortal         `json:"portal"`           // Which portal was used
	PortalURL      string            `json:"portal_url"`       // Link to job posting
	ApplicationURL string            `json:"application_url"`  // Direct link to application
	AppliedDate    *time.Time        `json:"applied_date"`     // When was it submitted
	Status         ApplicationStatus `json:"status"`           // Current status
	Priority       int               `json:"priority"`         // 1-5 (1=low, 5=high)
	Deadline       *time.Time        `json:"deadline"`         // Application deadline

	// Contact Person
	ContactName  string `json:"contact_name"`  // Recruiter/HR contact
	ContactEmail string `json:"contact_email"`
	ContactPhone string `json:"contact_phone"`

	// Timeline & Feedback
	Timeline []TimelineEvent       `json:"timeline"` // All events in chronological order
	Feedback []ApplicationFeedback `json:"feedback"` // All feedback

	// Documents Submitted
	DocumentsSubmitted []string `json:"documents_submitted"` // List of document names

	// Metadata
	Tags  []string `json:"tags"`  // e.g. "senior", "remote", "startup"
	Notes string   `json:"notes"` // Personal notes
	Color string   `json:"color"` // Color coding for visual organization

	// Automation & AI Suggestions (Future)
	AIMatchScore    float64 `json:"ai_match_score"`     // 0-100% how well CV matches job
	AISuggestions   string  `json:"ai_suggestions"`     // AI suggestions for improvement
	AutoFollowUpDate *time.Time `json:"auto_follow_up_date"` // Auto-reminder for follow-up
}

// NewJobApplication creates a new job application with defaults
func NewJobApplication() *JobApplication {
	now := time.Now()
	return &JobApplication{
		ID:                 uuid.New().String(),
		CreatedAt:          now,
		UpdatedAt:          now,
		Status:             StatusDraft,
		Priority:           3, // Medium priority
		Timeline:           []TimelineEvent{},
		Feedback:           []ApplicationFeedback{},
		DocumentsSubmitted: []string{},
		Tags:               []string{},
		Portal:             PortalOther,
	}
}

// AddTimelineEvent adds an event to the application timeline
func (app *JobApplication) AddTimelineEvent(eventType, title, details string) {
	event := TimelineEvent{
		ID:        uuid.New().String(),
		Type:      eventType,
		Title:     title,
		Details:   details,
		Timestamp: time.Now(),
	}
	app.Timeline = append(app.Timeline, event)
	app.UpdatedAt = time.Now()
}

// AddFeedback adds feedback to the application
func (app *JobApplication) AddFeedback(feedbackType, title, content string, rating int) {
	feedback := ApplicationFeedback{
		ID:        uuid.New().String(),
		Type:      feedbackType,
		Title:     title,
		Content:   content,
		Rating:    rating,
		Timestamp: time.Now(),
	}
	app.Feedback = append(app.Feedback, feedback)
	app.UpdatedAt = time.Now()
}

// UpdateStatus updates the application status and adds timeline event
func (app *JobApplication) UpdateStatus(newStatus ApplicationStatus, details string) {
	oldStatus := app.Status
	app.Status = newStatus
	app.UpdatedAt = time.Now()

	// Add timeline event for status change
	title := string(oldStatus) + " → " + string(newStatus)
	app.AddTimelineEvent("status_change", title, details)
}

// GetStatusColor returns the color for the application status
func (app *JobApplication) GetStatusColor() string {
	switch app.Status {
	case StatusDraft:
		return "#64748B" // Gray
	case StatusApplied, StatusUnderReview:
		return "#3B82F6" // Blue
	case StatusInterviewScheduled, StatusInterviewed, StatusSecondRound:
		return "#F59E0B" // Orange
	case StatusOffer, StatusAccepted:
		return "#10B981" // Green
	case StatusRejected, StatusNoResponse:
		return "#EF4444" // Red
	case StatusWithdrawn:
		return "#6B7280" // Gray
	default:
		return "#64748B"
	}
}

// ApplicationsStatistics represents statistics for job applications
type ApplicationsStatistics struct {
	TotalApplications int                `json:"total_applications"`
	StatusCounts      map[string]int     `json:"status_counts"`
	PortalCounts      map[string]int     `json:"portal_counts"`
	ResponseRate      float64            `json:"response_rate"` // % of applications that got a response
	InterviewRate     float64            `json:"interview_rate"` // % of applications that led to interview
	OfferRate         float64            `json:"offer_rate"`    // % of applications that led to offer
	AvgResponseTime   float64            `json:"avg_response_time"` // Days until first response
	TotalInterviews   int                `json:"total_interviews"`
	TotalOffers       int                `json:"total_offers"`
}
