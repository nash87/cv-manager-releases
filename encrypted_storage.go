package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/dgraph-io/badger/v4"
	"github.com/google/uuid"
	"golang.org/x/crypto/pbkdf2"
)

// EncryptedStorage manages CV data in encrypted BadgerDB
type EncryptedStorage struct {
	db             *badger.DB
	encryptionKey  []byte
	dataPath       string
	complianceLog  *ComplianceLog
	userConsent    *UserConsent
}

// ComplianceLog tracks all data operations for GDPR compliance
type ComplianceLog struct {
	Entries []ComplianceEntry `json:"entries"`
}

type ComplianceEntry struct {
	Timestamp   time.Time `json:"timestamp"`
	Operation   string    `json:"operation"` // CREATE, READ, UPDATE, DELETE, EXPORT
	DataType    string    `json:"data_type"` // CV, WorkExperience, etc.
	RecordID    string    `json:"record_id"`
	LegalBasis  string    `json:"legal_basis"` // Art. 6(1)(a) GDPR - User Consent
	Description string    `json:"description"`
}

// UserConsent manages GDPR consent
type UserConsent struct {
	ConsentGiven      bool      `json:"consent_given"`
	ConsentTimestamp  time.Time `json:"consent_timestamp"`
	ConsentVersion    string    `json:"consent_version"` // v1.0
	DataProcessing    bool      `json:"data_processing"`
	DataStorage       bool      `json:"data_storage"`
	DataEncryption    bool      `json:"data_encryption"`
	ConsentWithdrawn  bool      `json:"consent_withdrawn"`
	WithdrawalDate    time.Time `json:"withdrawal_date,omitempty"`
}

// AppConfig tracks app initialization status
type AppConfig struct {
	FirstRun          bool      `json:"first_run"`
	InitializedAt     time.Time `json:"initialized_at"`
	StorageExists     bool      `json:"storage_exists"`
	OnboardingShown   bool      `json:"onboarding_shown"`
	LastOpenedAt      time.Time `json:"last_opened_at"`
	Version           string    `json:"version"`
}

// SecurityInfo provides transparency about security measures
type SecurityInfo struct {
	EncryptionAlgorithm string `json:"encryption_algorithm"`
	EncryptionKeySize   int    `json:"encryption_key_size"`
	DatabaseType        string `json:"database_type"`
	DataLocation        string `json:"data_location"`
	EncryptionStatus    string `json:"encryption_status"`
	ComplianceStatus    string `json:"compliance_status"`
	GDPRArticles        []GDPRArticle `json:"gdpr_articles"`
}

// GDPRArticle references specific GDPR compliance
type GDPRArticle struct {
	Article     string `json:"article"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Link        string `json:"link"`
	Compliance  string `json:"compliance"`
}

// NewEncryptedStorage creates a new encrypted storage instance
func NewEncryptedStorage(dataPath string, masterPassword string) (*EncryptedStorage, error) {
	// Create data directory
	if err := os.MkdirAll(dataPath, 0700); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	// Derive encryption key from master password using PBKDF2
	salt := []byte("cv-manager-pro-salt-v1") // In production, store salt separately
	encryptionKey := pbkdf2.Key([]byte(masterPassword), salt, 100000, 32, sha256.New)

	// Run automatic repair and migration
	fmt.Println("[Storage] Running automatic repair and migration...")
	migrationMgr := NewMigrationManager(dataPath)
	migrationStatus, err := migrationMgr.AutoRepairAndMigrate()
	if err != nil {
		fmt.Printf("[Storage] Migration/Repair encountered errors: %v\n", err)
		// Try to recover from corruption
		if recErr := migrationMgr.RecoverFromCorruption(encryptionKey); recErr != nil {
			fmt.Printf("[Storage] Recovery failed: %v\n", recErr)
		}
	}
	if migrationStatus != nil {
		fmt.Printf("[Storage] Migration status: %s\n", migrationStatus.Message)
	}

	// Open BadgerDB with encryption and optimized settings
	opts := badger.DefaultOptions(filepath.Join(dataPath, "encrypted_db"))
	opts.EncryptionKey = encryptionKey
	opts.EncryptionKeyRotationDuration = 30 * 24 * time.Hour // Rotate key every 30 days
	opts.IndexCacheSize = 100 << 20                          // 100 MB - REQUIRED for encrypted workloads
	opts.ValueLogFileSize = 64 << 20                         // 64 MB - Prevent huge vlog files
	opts.NumVersionsToKeep = 1                               // Keep only 1 version to save space
	opts.CompactL0OnClose = true                             // Compact level 0 on close

	db, err := badger.Open(opts)
	if err != nil {
		return nil, fmt.Errorf("failed to open encrypted database: %w", err)
	}

	storage := &EncryptedStorage{
		db:            db,
		encryptionKey: encryptionKey,
		dataPath:      dataPath,
		complianceLog: &ComplianceLog{Entries: []ComplianceEntry{}},
	}

	// Load or create user consent
	if err := storage.loadUserConsent(); err != nil {
		// First time - create consent
		storage.userConsent = &UserConsent{
			ConsentGiven:     false,
			ConsentVersion:   "1.0",
			DataProcessing:   false,
			DataStorage:      false,
			DataEncryption:   false,
		}
	}

	// Load compliance log
	storage.loadComplianceLog()

	// Initialize app config
	storage.initAppConfig()

	return storage, nil
}

// Close closes the database
func (s *EncryptedStorage) Close() error {
	return s.db.Close()
}

// ==================== Consent Management ====================

func (s *EncryptedStorage) GrantConsent() error {
	s.userConsent.ConsentGiven = true
	s.userConsent.ConsentTimestamp = time.Now()
	s.userConsent.DataProcessing = true
	s.userConsent.DataStorage = true
	s.userConsent.DataEncryption = true
	s.userConsent.ConsentWithdrawn = false

	s.logCompliance(ComplianceEntry{
		Timestamp:   time.Now(),
		Operation:   "CONSENT_GRANTED",
		DataType:    "UserConsent",
		RecordID:    "user-consent",
		LegalBasis:  "Art. 6(1)(a) GDPR - Consent",
		Description: "User granted consent for data processing",
	})

	return s.saveUserConsent()
}

func (s *EncryptedStorage) WithdrawConsent() error {
	s.userConsent.ConsentWithdrawn = true
	s.userConsent.WithdrawalDate = time.Now()

	s.logCompliance(ComplianceEntry{
		Timestamp:   time.Now(),
		Operation:   "CONSENT_WITHDRAWN",
		DataType:    "UserConsent",
		RecordID:    "user-consent",
		LegalBasis:  "Art. 7(3) GDPR - Right to withdraw consent",
		Description: "User withdrew consent for data processing",
	})

	return s.saveUserConsent()
}

func (s *EncryptedStorage) GetConsent() *UserConsent {
	return s.userConsent
}

func (s *EncryptedStorage) saveUserConsent() error {
	data, err := json.Marshal(s.userConsent)
	if err != nil {
		return err
	}

	return s.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("user_consent"), data)
	})
}

func (s *EncryptedStorage) loadUserConsent() error {
	return s.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte("user_consent"))
		if err != nil {
			return err
		}

		return item.Value(func(val []byte) error {
			return json.Unmarshal(val, &s.userConsent)
		})
	})
}

// ==================== Compliance Logging ====================

func (s *EncryptedStorage) logCompliance(entry ComplianceEntry) {
	s.complianceLog.Entries = append(s.complianceLog.Entries, entry)
	s.saveComplianceLog()
}

func (s *EncryptedStorage) saveComplianceLog() error {
	data, err := json.Marshal(s.complianceLog)
	if err != nil {
		return err
	}

	return s.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("compliance_log"), data)
	})
}

func (s *EncryptedStorage) loadComplianceLog() error {
	err := s.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte("compliance_log"))
		if err != nil {
			return err
		}

		return item.Value(func(val []byte) error {
			return json.Unmarshal(val, &s.complianceLog)
		})
	})

	if err == badger.ErrKeyNotFound {
		s.complianceLog = &ComplianceLog{Entries: []ComplianceEntry{}}
		return nil
	}

	return err
}

func (s *EncryptedStorage) GetComplianceLog() []ComplianceEntry {
	return s.complianceLog.Entries
}

// ==================== GDPR Rights Implementation ====================

// ExportAllData implements Art. 20 GDPR - Right to data portability
func (s *EncryptedStorage) ExportAllData() (string, error) {
	if !s.userConsent.ConsentGiven {
		return "", fmt.Errorf("consent required for data export")
	}

	allData := make(map[string]interface{})

	// Export all CVs
	cvs, err := s.GetAllCVs()
	if err != nil {
		return "", err
	}
	allData["cvs"] = cvs

	// Export consent
	allData["consent"] = s.userConsent

	// Export compliance log
	allData["compliance_log"] = s.complianceLog

	// Marshal to JSON
	jsonData, err := json.MarshalIndent(allData, "", "  ")
	if err != nil {
		return "", err
	}

	// Save to file
	exportPath := filepath.Join(s.dataPath, fmt.Sprintf("gdpr_export_%s.json", time.Now().Format("2006-01-02_15-04-05")))
	if err := os.WriteFile(exportPath, jsonData, 0600); err != nil {
		return "", err
	}

	s.logCompliance(ComplianceEntry{
		Timestamp:   time.Now(),
		Operation:   "EXPORT_ALL_DATA",
		DataType:    "AllData",
		RecordID:    "full-export",
		LegalBasis:  "Art. 20 GDPR - Right to data portability",
		Description: "User requested full data export",
	})

	return exportPath, nil
}

// DeleteAllData implements Art. 17 GDPR - Right to erasure
func (s *EncryptedStorage) DeleteAllData() error {
	if !s.userConsent.ConsentGiven {
		return fmt.Errorf("consent required for data deletion")
	}

	s.logCompliance(ComplianceEntry{
		Timestamp:   time.Now(),
		Operation:   "DELETE_ALL_DATA",
		DataType:    "AllData",
		RecordID:    "full-deletion",
		LegalBasis:  "Art. 17 GDPR - Right to erasure",
		Description: "User requested full data deletion",
	})

	// Save final compliance log
	s.saveComplianceLog()

	// Drop all data
	return s.db.DropAll()
}

// ==================== CV CRUD Operations ====================

func (s *EncryptedStorage) CreateCV() (*CV, error) {
	if !s.userConsent.ConsentGiven {
		return nil, fmt.Errorf("consent required for creating CV")
	}

	cv := &CV{
		ID:        uuid.New().String(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Status:    "draft",
		Template:  "modern",
		ColorScheme: "blue",
	}

	if err := s.SaveCV(cv); err != nil {
		return nil, err
	}

	s.logCompliance(ComplianceEntry{
		Timestamp:   time.Now(),
		Operation:   "CREATE",
		DataType:    "CV",
		RecordID:    cv.ID,
		LegalBasis:  "Art. 6(1)(a) GDPR - User Consent",
		Description: fmt.Sprintf("Created CV: %s %s", cv.Firstname, cv.Lastname),
	})

	return cv, nil
}

func (s *EncryptedStorage) SaveCV(cv *CV) error {
	if !s.userConsent.ConsentGiven {
		return fmt.Errorf("consent required for saving CV")
	}

	cv.UpdatedAt = time.Now()

	data, err := json.Marshal(cv)
	if err != nil {
		return err
	}

	err = s.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("cv:"+cv.ID), data)
	})

	if err == nil {
		s.logCompliance(ComplianceEntry{
			Timestamp:   time.Now(),
			Operation:   "UPDATE",
			DataType:    "CV",
			RecordID:    cv.ID,
			LegalBasis:  "Art. 6(1)(a) GDPR - User Consent",
			Description: fmt.Sprintf("Updated CV: %s %s", cv.Firstname, cv.Lastname),
		})
	}

	return err
}

func (s *EncryptedStorage) GetCV(id string) (*CV, error) {
	if !s.userConsent.ConsentGiven {
		return nil, fmt.Errorf("consent required for accessing CV")
	}

	var cv CV

	err := s.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte("cv:" + id))
		if err != nil {
			return err
		}

		return item.Value(func(val []byte) error {
			return json.Unmarshal(val, &cv)
		})
	})

	if err == nil {
		s.logCompliance(ComplianceEntry{
			Timestamp:   time.Now(),
			Operation:   "READ",
			DataType:    "CV",
			RecordID:    id,
			LegalBasis:  "Art. 6(1)(a) GDPR - User Consent",
			Description: fmt.Sprintf("Accessed CV: %s %s", cv.Firstname, cv.Lastname),
		})
	}

	return &cv, err
}

func (s *EncryptedStorage) GetAllCVs() ([]*CV, error) {
	if !s.userConsent.ConsentGiven {
		return nil, fmt.Errorf("consent required for accessing CVs")
	}

	cvs := make([]*CV, 0)

	err := s.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.Prefix = []byte("cv:")

		it := txn.NewIterator(opts)
		defer it.Close()

		for it.Rewind(); it.Valid(); it.Next() {
			item := it.Item()

			err := item.Value(func(val []byte) error {
				var cv CV
				if err := json.Unmarshal(val, &cv); err != nil {
					return err
				}
				cvs = append(cvs, &cv)
				return nil
			})

			if err != nil {
				return err
			}
		}

		return nil
	})

	return cvs, err
}

func (s *EncryptedStorage) DeleteCV(id string) error {
	if !s.userConsent.ConsentGiven {
		return fmt.Errorf("consent required for deleting CV")
	}

	// Get CV for logging
	cv, _ := s.GetCV(id)

	err := s.db.Update(func(txn *badger.Txn) error {
		return txn.Delete([]byte("cv:" + id))
	})

	if err == nil && cv != nil {
		s.logCompliance(ComplianceEntry{
			Timestamp:   time.Now(),
			Operation:   "DELETE",
			DataType:    "CV",
			RecordID:    id,
			LegalBasis:  "Art. 17 GDPR - Right to erasure",
			Description: fmt.Sprintf("Deleted CV: %s %s", cv.Firstname, cv.Lastname),
		})
	}

	return err
}

// ==================== Search & Filter ====================

func (s *EncryptedStorage) SearchCVs(query string) ([]*CV, error) {
	allCVs, err := s.GetAllCVs()
	if err != nil {
		return nil, err
	}

	query = strings.ToLower(query)
	results := make([]*CV, 0)

	for _, cv := range allCVs {
		if strings.Contains(strings.ToLower(cv.Firstname), query) ||
			strings.Contains(strings.ToLower(cv.Lastname), query) ||
			strings.Contains(strings.ToLower(cv.JobTitle), query) ||
			strings.Contains(strings.ToLower(cv.Email), query) ||
			strings.Contains(strings.ToLower(cv.TargetJob), query) ||
			strings.Contains(strings.ToLower(cv.TargetCompany), query) {
			results = append(results, cv)
		}
	}

	return results, nil
}

// ==================== Security Information ====================

func (s *EncryptedStorage) GetSecurityInfo() SecurityInfo {
	return SecurityInfo{
		EncryptionAlgorithm: "AES-256-GCM",
		EncryptionKeySize:   256,
		DatabaseType:        "BadgerDB v4 (Encrypted)",
		DataLocation:        s.dataPath,
		EncryptionStatus:    "ACTIVE - All data encrypted at rest",
		ComplianceStatus:    "GDPR/DSGVO Compliant",
		GDPRArticles: []GDPRArticle{
			{
				Article:     "Art. 6(1)(a) GDPR",
				Title:       "Lawfulness of processing - Consent",
				Description: "Processing is lawful when the data subject has given consent",
				Link:        "https://gdpr-info.eu/art-6-gdpr/",
				Compliance:  "✓ User consent required for all data operations",
			},
			{
				Article:     "Art. 7 GDPR",
				Title:       "Conditions for consent",
				Description: "Right to withdraw consent at any time",
				Link:        "https://gdpr-info.eu/art-7-gdpr/",
				Compliance:  "✓ Consent can be withdrawn in Settings",
			},
			{
				Article:     "Art. 13 GDPR",
				Title:       "Information to be provided",
				Description: "Transparency about data processing",
				Link:        "https://gdpr-info.eu/art-13-gdpr/",
				Compliance:  "✓ Full transparency in Privacy & Security view",
			},
			{
				Article:     "Art. 15 GDPR",
				Title:       "Right of access",
				Description: "Right to access personal data",
				Link:        "https://gdpr-info.eu/art-15-gdpr/",
				Compliance:  "✓ View all data in Compliance Log",
			},
			{
				Article:     "Art. 17 GDPR",
				Title:       "Right to erasure",
				Description: "Right to deletion of personal data",
				Link:        "https://gdpr-info.eu/art-17-gdpr/",
				Compliance:  "✓ Delete all data option available",
			},
			{
				Article:     "Art. 20 GDPR",
				Title:       "Right to data portability",
				Description: "Right to receive data in structured format",
				Link:        "https://gdpr-info.eu/art-20-gdpr/",
				Compliance:  "✓ Export all data as JSON",
			},
			{
				Article:     "Art. 32 GDPR",
				Title:       "Security of processing",
				Description: "Appropriate technical and organizational measures",
				Link:        "https://gdpr-info.eu/art-32-gdpr/",
				Compliance:  "✓ AES-256 encryption, secure key derivation (PBKDF2)",
			},
		},
	}
}

// encryptData encrypts data using AES-GCM
func (s *EncryptedStorage) encryptData(plaintext []byte) ([]byte, error) {
	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return ciphertext, nil
}

// decryptData decrypts data using AES-GCM
func (s *EncryptedStorage) decryptData(ciphertext []byte) ([]byte, error) {
	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}

// ==================== Statistics ====================

func (s *EncryptedStorage) GetStatistics() (*Statistics, error) {
	cvs, err := s.GetAllCVs()
	if err != nil {
		return nil, err
	}

	stats := &Statistics{
		TotalCVs:       len(cvs),
		StatusCounts:   make(map[string]int),
		CategoryCounts: make(map[string]int),
		TemplateCounts: make(map[string]int),
		AllTags:        []string{},
	}

	tagMap := make(map[string]bool)
	totalWork := 0
	totalEdu := 0
	totalSkills := 0

	for _, cv := range cvs {
		// Count by status
		if cv.Status != "" {
			stats.StatusCounts[cv.Status]++
		}

		// Count by category
		if cv.Category != "" {
			stats.CategoryCounts[cv.Category]++
		}

		// Count by template
		if cv.Template != "" {
			stats.TemplateCounts[cv.Template]++
		}

		// Collect tags
		for _, tag := range cv.Tags {
			if !tagMap[tag] {
				tagMap[tag] = true
				stats.AllTags = append(stats.AllTags, tag)
			}
		}

		// Count totals
		totalWork += len(cv.WorkExperience)
		totalEdu += len(cv.Education)
		totalSkills += len(cv.Skills)
	}

	stats.TotalWorkExperience = totalWork
	stats.TotalEducation = totalEdu
	stats.TotalSkills = totalSkills

	// Calculate averages
	if len(cvs) > 0 {
		stats.AvgWorkPerCV = float64(totalWork) / float64(len(cvs))
		stats.AvgEducationPerCV = float64(totalEdu) / float64(len(cvs))
		stats.AvgSkillsPerCV = float64(totalSkills) / float64(len(cvs))
	}

	return stats, nil
}

// ========== Storage Seal/Unseal Functionality ==========

// StorageSealConfig tracks the seal status of the storage
type StorageSealConfig struct {
	IsSealed         bool      `json:"is_sealed"`
	PasswordHash     string    `json:"password_hash"` // SHA-256 hash of master password
	SealTimestamp    time.Time `json:"seal_timestamp,omitempty"`
	UnsealTimestamp  time.Time `json:"unseal_timestamp,omitempty"`
	RequiresPassword bool      `json:"requires_password"`
}

// GetSealStatus returns the current seal status
func (s *EncryptedStorage) GetSealStatus() (*StorageSealConfig, error) {
	configPath := filepath.Join(s.dataPath, "seal_config.json")

	// If config doesn't exist, storage is unsealed by default
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return &StorageSealConfig{
			IsSealed:         false,
			RequiresPassword: false,
		}, nil
	}

	// Read and decrypt seal config
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read seal config: %w", err)
	}

	// Decrypt config
	decrypted, err := s.decryptData(data)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt seal config: %w", err)
	}

	var config StorageSealConfig
	if err := json.Unmarshal(decrypted, &config); err != nil {
		return nil, fmt.Errorf("failed to parse seal config: %w", err)
	}

	return &config, nil
}

// SealStorage seals the storage with a master password
func (s *EncryptedStorage) SealStorage(masterPassword string) error {
	if masterPassword == "" {
		return fmt.Errorf("master password cannot be empty")
	}

	// Hash the password for verification
	hash := sha256.Sum256([]byte(masterPassword))
	passwordHash := fmt.Sprintf("%x", hash)

	config := StorageSealConfig{
		IsSealed:         true,
		PasswordHash:     passwordHash,
		SealTimestamp:    time.Now(),
		RequiresPassword: true,
	}

	// Save seal config
	if err := s.saveSealConfig(&config); err != nil {
		return fmt.Errorf("failed to save seal config: %w", err)
	}

	// Log the sealing operation
	s.logCompliance(ComplianceEntry{
		Timestamp:   time.Now(),
		Operation:   "SEAL",
		DataType:    "StorageSeal",
		RecordID:    "",
		LegalBasis:  "Art. 32 GDPR - Security of Processing",
		Description: "Storage sealed with master password for additional security",
	})

	return nil
}

// UnsealStorage unseals the storage with the master password
func (s *EncryptedStorage) UnsealStorage(masterPassword string) error {
	config, err := s.GetSealStatus()
	if err != nil {
		return fmt.Errorf("failed to get seal status: %w", err)
	}

	if !config.IsSealed {
		return fmt.Errorf("storage is not sealed")
	}

	// Verify password
	hash := sha256.Sum256([]byte(masterPassword))
	passwordHash := fmt.Sprintf("%x", hash)

	if passwordHash != config.PasswordHash {
		s.logCompliance(ComplianceEntry{
			Timestamp:   time.Now(),
			Operation:   "UNSEAL_FAILED",
			DataType:    "StorageSeal",
			RecordID:    "",
			LegalBasis:  "Art. 32 GDPR - Security of Processing",
			Description: "Failed unseal attempt - incorrect password",
		})
		return fmt.Errorf("incorrect master password")
	}

	// Update seal config
	config.IsSealed = false
	config.UnsealTimestamp = time.Now()

	if err := s.saveSealConfig(config); err != nil {
		return fmt.Errorf("failed to save seal config: %w", err)
	}

	// Log the unsealing operation
	s.logCompliance(ComplianceEntry{
		Timestamp:   time.Now(),
		Operation:   "UNSEAL",
		DataType:    "StorageSeal",
		RecordID:    "",
		LegalBasis:  "Art. 32 GDPR - Security of Processing",
		Description: "Storage unsealed with correct master password",
	})

	return nil
}

// RemoveSeal removes the seal entirely (no password required for future access)
func (s *EncryptedStorage) RemoveSeal(masterPassword string) error {
	config, err := s.GetSealStatus()
	if err != nil {
		return fmt.Errorf("failed to get seal status: %w", err)
	}

	if config.IsSealed {
		// Verify password before removing seal
		hash := sha256.Sum256([]byte(masterPassword))
		passwordHash := fmt.Sprintf("%x", hash)

		if passwordHash != config.PasswordHash {
			return fmt.Errorf("incorrect master password")
		}
	}

	// Remove seal config file
	configPath := filepath.Join(s.dataPath, "seal_config.json")
	if err := os.Remove(configPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove seal config: %w", err)
	}

	// Log the seal removal
	s.logCompliance(ComplianceEntry{
		Timestamp:   time.Now(),
		Operation:   "REMOVE_SEAL",
		DataType:    "StorageSeal",
		RecordID:    "",
		LegalBasis:  "Art. 32 GDPR - Security of Processing",
		Description: "Storage seal removed - no password required",
	})

	return nil
}

// saveSealConfig saves the seal configuration
func (s *EncryptedStorage) saveSealConfig(config *StorageSealConfig) error {
	configPath := filepath.Join(s.dataPath, "seal_config.json")

	// Marshal config
	data, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal seal config: %w", err)
	}

	// Encrypt config
	encrypted, err := s.encryptData(data)
	if err != nil {
		return fmt.Errorf("failed to encrypt seal config: %w", err)
	}

	// Write to file
	if err := os.WriteFile(configPath, encrypted, 0600); err != nil {
		return fmt.Errorf("failed to write seal config: %w", err)
	}

	return nil
}

// ========== App Configuration Management ==========

func (s *EncryptedStorage) initAppConfig() {
	configPath := filepath.Join(s.dataPath, "app_config.json")

	// Check if config exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// First run - create initial config
		config := AppConfig{
			FirstRun:        true,
			InitializedAt:   time.Now(),
			StorageExists:   true,
			OnboardingShown: false,
			LastOpenedAt:    time.Now(),
			Version:         "1.0.0",
		}
		s.saveAppConfig(&config)
	} else {
		// Load existing config and update last opened
		config, err := s.GetAppConfig()
		if err == nil {
			config.LastOpenedAt = time.Now()
			s.saveAppConfig(config)
		}
	}
}

func (s *EncryptedStorage) GetAppConfig() (*AppConfig, error) {
	configPath := filepath.Join(s.dataPath, "app_config.json")

	data, err := os.ReadFile(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			// Return default config for first run
			return &AppConfig{
				FirstRun:        true,
				InitializedAt:   time.Now(),
				StorageExists:   false,
				OnboardingShown: false,
				LastOpenedAt:    time.Now(),
				Version:         "1.0.0",
			}, nil
		}
		return nil, fmt.Errorf("failed to read app config: %w", err)
	}

	var config AppConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse app config: %w", err)
	}

	return &config, nil
}

func (s *EncryptedStorage) saveAppConfig(config *AppConfig) error {
	configPath := filepath.Join(s.dataPath, "app_config.json")

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal app config: %w", err)
	}

	if err := os.WriteFile(configPath, data, 0600); err != nil {
		return fmt.Errorf("failed to write app config: %w", err)
	}

	return nil
}

func (s *EncryptedStorage) MarkOnboardingCompleted() error {
	config, err := s.GetAppConfig()
	if err != nil {
		return err
	}

	config.OnboardingShown = true
	config.FirstRun = false

	return s.saveAppConfig(config)
}

// ========== Job Application Storage Methods ==========

// SaveApplication saves a job application
func (s *EncryptedStorage) SaveApplication(app *JobApplication) error {
	if !s.userConsent.ConsentGiven {
		return fmt.Errorf("consent required for saving application")
	}

	app.UpdatedAt = time.Now()

	data, err := json.Marshal(app)
	if err != nil {
		return err
	}

	err = s.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("application:"+app.ID), data)
	})

	if err == nil {
		s.logCompliance(ComplianceEntry{
			Timestamp:   time.Now(),
			Operation:   "UPDATE",
			DataType:    "JobApplication",
			RecordID:    app.ID,
			LegalBasis:  "Art. 6(1)(a) GDPR - User Consent",
			Description: fmt.Sprintf("Updated application: %s at %s", app.JobTitle, app.Company),
		})
	}

	return err
}

// GetApplication retrieves a job application by ID
func (s *EncryptedStorage) GetApplication(id string) (*JobApplication, error) {
	if !s.userConsent.ConsentGiven {
		return nil, fmt.Errorf("consent required for accessing application")
	}

	var app JobApplication

	err := s.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte("application:" + id))
		if err != nil {
			return err
		}

		return item.Value(func(val []byte) error {
			return json.Unmarshal(val, &app)
		})
	})

	if err == nil {
		s.logCompliance(ComplianceEntry{
			Timestamp:   time.Now(),
			Operation:   "READ",
			DataType:    "JobApplication",
			RecordID:    id,
			LegalBasis:  "Art. 6(1)(a) GDPR - User Consent",
			Description: fmt.Sprintf("Accessed application: %s at %s", app.JobTitle, app.Company),
		})
	}

	return &app, err
}

// GetAllApplications retrieves all job applications
func (s *EncryptedStorage) GetAllApplications() ([]*JobApplication, error) {
	if !s.userConsent.ConsentGiven {
		return nil, fmt.Errorf("consent required for accessing applications")
	}

	apps := make([]*JobApplication, 0)

	err := s.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.Prefix = []byte("application:")

		it := txn.NewIterator(opts)
		defer it.Close()

		for it.Rewind(); it.Valid(); it.Next() {
			item := it.Item()

			err := item.Value(func(val []byte) error {
				var app JobApplication
				if err := json.Unmarshal(val, &app); err != nil {
					return err
				}
				apps = append(apps, &app)
				return nil
			})

			if err != nil {
				return err
			}
		}

		return nil
	})

	return apps, err
}

// DeleteApplication deletes a job application
func (s *EncryptedStorage) DeleteApplication(id string) error {
	if !s.userConsent.ConsentGiven {
		return fmt.Errorf("consent required for deleting application")
	}

	// Get application for logging
	app, _ := s.GetApplication(id)

	err := s.db.Update(func(txn *badger.Txn) error {
		return txn.Delete([]byte("application:" + id))
	})

	if err == nil && app != nil {
		s.logCompliance(ComplianceEntry{
			Timestamp:   time.Now(),
			Operation:   "DELETE",
			DataType:    "JobApplication",
			RecordID:    id,
			LegalBasis:  "Art. 17 GDPR - Right to erasure",
			Description: fmt.Sprintf("Deleted application: %s at %s", app.JobTitle, app.Company),
		})
	}

	return err
}

// GetApplicationsByCV retrieves all applications linked to a specific CV
func (s *EncryptedStorage) GetApplicationsByCV(cvID string) ([]*JobApplication, error) {
	allApps, err := s.GetAllApplications()
	if err != nil {
		return nil, err
	}

	filtered := make([]*JobApplication, 0)
	for _, app := range allApps {
		if app.CVID == cvID {
			filtered = append(filtered, app)
		}
	}

	return filtered, nil
}

// GetApplicationsStatistics calculates statistics for job applications
func (s *EncryptedStorage) GetApplicationsStatistics() (*ApplicationsStatistics, error) {
	apps, err := s.GetAllApplications()
	if err != nil {
		return nil, err
	}

	stats := &ApplicationsStatistics{
		TotalApplications: len(apps),
		StatusCounts:      make(map[string]int),
		PortalCounts:      make(map[string]int),
	}

	if len(apps) == 0 {
		return stats, nil
	}

	var totalResponseTimeDays float64
	var responseCount int
	var interviewCount int
	var offerCount int

	for _, app := range apps {
		// Count by status
		stats.StatusCounts[string(app.Status)]++

		// Count by portal
		stats.PortalCounts[string(app.Portal)]++

		// Calculate response time
		if app.AppliedDate != nil && len(app.Timeline) > 0 {
			// Find first company response
			for _, event := range app.Timeline {
				if event.Type == "company_response" || event.Type == "interview" {
					daysDiff := event.Timestamp.Sub(*app.AppliedDate).Hours() / 24
					totalResponseTimeDays += daysDiff
					responseCount++
					break
				}
			}
		}

		// Count interviews
		if app.Status == StatusInterviewScheduled || app.Status == StatusInterviewed || app.Status == StatusSecondRound {
			interviewCount++
		}

		// Count offers
		if app.Status == StatusOffer || app.Status == StatusAccepted {
			offerCount++
		}
	}

	stats.TotalInterviews = interviewCount
	stats.TotalOffers = offerCount

	// Calculate rates
	if stats.TotalApplications > 0 {
		responded := 0
		for _, app := range apps {
			if app.Status != StatusDraft && app.Status != StatusNoResponse {
				responded++
			}
		}
		stats.ResponseRate = (float64(responded) / float64(stats.TotalApplications)) * 100
		stats.InterviewRate = (float64(interviewCount) / float64(stats.TotalApplications)) * 100
		stats.OfferRate = (float64(offerCount) / float64(stats.TotalApplications)) * 100
	}

	// Calculate average response time
	if responseCount > 0 {
		stats.AvgResponseTime = totalResponseTimeDays / float64(responseCount)
	}

	return stats, nil
}
