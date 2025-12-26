package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/dgraph-io/badger/v4"
)

// MigrationManager handles database migrations and repairs
type MigrationManager struct {
	dataPath      string
	currentVersion string
	previousVersion string
	migrationLog   []MigrationLogEntry
}

// MigrationLogEntry logs migration activities
type MigrationLogEntry struct {
	Timestamp       time.Time `json:"timestamp"`
	FromVersion     string    `json:"from_version"`
	ToVersion       string    `json:"to_version"`
	Action          string    `json:"action"` // REPAIR, MIGRATE, BACKUP, RESTORE
	Success         bool      `json:"success"`
	ErrorMessage    string    `json:"error_message,omitempty"`
	Details         string    `json:"details"`
	DataAffected    int       `json:"data_affected"`
}

// MigrationStatus represents the current migration status
type MigrationStatus struct {
	InProgress      bool      `json:"in_progress"`
	CurrentStep     string    `json:"current_step"`
	TotalSteps      int       `json:"total_steps"`
	CompletedSteps  int       `json:"completed_steps"`
	Message         string    `json:"message"`
	Success         bool      `json:"success"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time,omitempty"`
}

// NewMigrationManager creates a new migration manager
func NewMigrationManager(dataPath string) *MigrationManager {
	return &MigrationManager{
		dataPath:       dataPath,
		currentVersion: GetVersion(),
		migrationLog:   []MigrationLogEntry{},
	}
}

// AutoRepairAndMigrate automatically repairs and migrates the database
func (mm *MigrationManager) AutoRepairAndMigrate() (*MigrationStatus, error) {
	status := &MigrationStatus{
		InProgress:     true,
		TotalSteps:     5,
		CompletedSteps: 0,
		StartTime:      time.Now(),
		Message:        "Starte automatische Reparatur...",
	}

	// Step 1: Load previous version
	status.CurrentStep = "Version prüfen"
	status.Message = "Lade vorherige Version..."
	mm.loadPreviousVersion()
	status.CompletedSteps = 1

	// Step 2: Check if migration is needed
	status.CurrentStep = "Migrationsbedarf ermitteln"
	needsMigration := mm.needsMigration()
	status.CompletedSteps = 2

	if !needsMigration && !mm.needsRepair() {
		status.InProgress = false
		status.Success = true
		status.Message = "Keine Reparatur oder Migration erforderlich"
		status.CurrentStep = "Abgeschlossen"
		status.CompletedSteps = status.TotalSteps
		status.EndTime = time.Now()
		return status, nil
	}

	// Step 3: Backup existing data
	status.CurrentStep = "Daten sichern"
	status.Message = "Erstelle Backup..."
	if err := mm.backupDatabase(); err != nil {
		fmt.Printf("[Migration] Warning: Backup failed: %v\n", err)
		// Continue anyway - don't fail on backup error
	}
	status.CompletedSteps = 3

	// Step 4: Repair database if needed
	status.CurrentStep = "Datenbank reparieren"
	status.Message = "Repariere Datenbank..."
	if err := mm.repairDatabase(); err != nil {
		status.InProgress = false
		status.Success = false
		status.Message = fmt.Sprintf("Reparatur fehlgeschlagen: %v", err)
		status.EndTime = time.Now()
		return status, err
	}
	status.CompletedSteps = 4

	// Step 5: Run migrations
	status.CurrentStep = "Migration durchführen"
	status.Message = "Führe Datenmigration durch..."
	if err := mm.runMigrations(); err != nil {
		status.InProgress = false
		status.Success = false
		status.Message = fmt.Sprintf("Migration fehlgeschlagen: %v", err)
		status.EndTime = time.Now()
		return status, err
	}
	status.CompletedSteps = 5

	// Update version
	mm.saveCurrentVersion()

	status.InProgress = false
	status.Success = true
	status.CurrentStep = "Abgeschlossen"
	status.Message = fmt.Sprintf("Migration von v%s auf v%s erfolgreich", mm.previousVersion, mm.currentVersion)
	status.EndTime = time.Now()

	return status, nil
}

// needsMigration checks if migration is needed
func (mm *MigrationManager) needsMigration() bool {
	if mm.previousVersion == "" {
		return false // First run
	}
	return IsNewerVersion(mm.currentVersion, mm.previousVersion)
}

// needsRepair checks if database repair is needed
func (mm *MigrationManager) needsRepair() bool {
	dbPath := filepath.Join(mm.dataPath, "encrypted_db")

	// Check if LOCK file exists and is stale
	lockFile := filepath.Join(dbPath, "LOCK")
	if info, err := os.Stat(lockFile); err == nil {
		// If LOCK file is older than 1 hour, it might be stale
		if time.Since(info.ModTime()) > time.Hour {
			return true
		}
	}

	// Check for corrupted vlog files (> 2GB indicates possible corruption)
	vlogPattern := filepath.Join(dbPath, "*.vlog")
	if matches, err := filepath.Glob(vlogPattern); err == nil {
		for _, match := range matches {
			if info, err := os.Stat(match); err == nil {
				if info.Size() > 2*1024*1024*1024 { // > 2GB
					return true
				}
			}
		}
	}

	return false
}

// backupDatabase creates a backup of the current database
func (mm *MigrationManager) backupDatabase() error {
	timestamp := time.Now().Format("20060102-150405")
	backupPath := filepath.Join(mm.dataPath, fmt.Sprintf("backup-%s-v%s", timestamp, mm.previousVersion))

	dbPath := filepath.Join(mm.dataPath, "encrypted_db")

	if err := os.MkdirAll(backupPath, 0700); err != nil {
		return fmt.Errorf("failed to create backup directory: %w", err)
	}

	// Copy database files
	if err := copyDir(dbPath, filepath.Join(backupPath, "encrypted_db")); err != nil {
		return fmt.Errorf("failed to copy database: %w", err)
	}

	// Log backup
	mm.logMigration(MigrationLogEntry{
		Timestamp:    time.Now(),
		FromVersion:  mm.previousVersion,
		ToVersion:    mm.currentVersion,
		Action:       "BACKUP",
		Success:      true,
		Details:      fmt.Sprintf("Backup created at %s", backupPath),
	})

	fmt.Printf("[Migration] Backup created: %s\n", backupPath)
	return nil
}

// repairDatabase repairs the BadgerDB database
func (mm *MigrationManager) repairDatabase() error {
	dbPath := filepath.Join(mm.dataPath, "encrypted_db")

	// Remove stale LOCK file
	lockFile := filepath.Join(dbPath, "LOCK")
	if err := os.Remove(lockFile); err != nil && !os.IsNotExist(err) {
		fmt.Printf("[Migration] Warning: Could not remove LOCK file: %v\n", err)
	}

	// Remove corrupted vlog files
	vlogPattern := filepath.Join(dbPath, "*.vlog")
	if matches, err := filepath.Glob(vlogPattern); err == nil {
		for _, match := range matches {
			if info, err := os.Stat(match); err == nil {
				// Remove vlog files > 2GB (likely corrupted)
				if info.Size() > 2*1024*1024*1024 {
					if err := os.Remove(match); err != nil {
						fmt.Printf("[Migration] Warning: Could not remove corrupted vlog: %v\n", err)
					} else {
						fmt.Printf("[Migration] Removed corrupted vlog: %s\n", match)
					}
				}
			}
		}
	}

	// Log repair
	mm.logMigration(MigrationLogEntry{
		Timestamp:   time.Now(),
		FromVersion: mm.previousVersion,
		ToVersion:   mm.currentVersion,
		Action:      "REPAIR",
		Success:     true,
		Details:     "Removed stale locks and corrupted files",
	})

	fmt.Println("[Migration] Database repair completed")
	return nil
}

// runMigrations runs version-specific migrations
func (mm *MigrationManager) runMigrations() error {
	// Version-specific migrations
	if mm.previousVersion == "" {
		// First run - no migration needed
		return nil
	}

	// Migration from 1.0.0 to 1.1.0
	if mm.previousVersion == "1.0.0" && mm.currentVersion >= "1.1.0" {
		if err := mm.migrate_1_0_to_1_1(); err != nil {
			return err
		}
	}

	// Log migration
	mm.logMigration(MigrationLogEntry{
		Timestamp:   time.Now(),
		FromVersion: mm.previousVersion,
		ToVersion:   mm.currentVersion,
		Action:      "MIGRATE",
		Success:     true,
		Details:     fmt.Sprintf("Migrated from v%s to v%s", mm.previousVersion, mm.currentVersion),
	})

	fmt.Printf("[Migration] Migration from v%s to v%s completed\n", mm.previousVersion, mm.currentVersion)
	return nil
}

// migrate_1_0_to_1_1 migrates data from version 1.0.0 to 1.1.0
func (mm *MigrationManager) migrate_1_0_to_1_1() error {
	// In version 1.1.0, we improved BadgerDB configuration
	// The database structure is compatible, so no data migration needed
	// Just ensure the new IndexCache settings are applied
	fmt.Println("[Migration] No data changes required for 1.0.0 -> 1.1.0")
	return nil
}

// loadPreviousVersion loads the previous version from app_config.json
func (mm *MigrationManager) loadPreviousVersion() {
	configPath := filepath.Join(mm.dataPath, "app_config.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		mm.previousVersion = ""
		return
	}

	var config AppConfig
	if err := json.Unmarshal(data, &config); err != nil {
		mm.previousVersion = ""
		return
	}

	mm.previousVersion = config.Version
}

// saveCurrentVersion saves the current version to app_config.json
func (mm *MigrationManager) saveCurrentVersion() {
	configPath := filepath.Join(mm.dataPath, "app_config.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return
	}

	var config AppConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return
	}

	config.Version = mm.currentVersion
	config.LastOpenedAt = time.Now()

	updatedData, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return
	}

	os.WriteFile(configPath, updatedData, 0600)
}

// logMigration logs a migration entry
func (mm *MigrationManager) logMigration(entry MigrationLogEntry) {
	mm.migrationLog = append(mm.migrationLog, entry)

	// Save to file
	logPath := filepath.Join(mm.dataPath, "migration_log.json")
	data, _ := json.MarshalIndent(mm.migrationLog, "", "  ")
	os.WriteFile(logPath, data, 0600)
}

// GetMigrationLog returns the migration log
func (mm *MigrationManager) GetMigrationLog() []MigrationLogEntry {
	return mm.migrationLog
}

// copyDir recursively copies a directory
func copyDir(src string, dst string) error {
	if err := os.MkdirAll(dst, 0700); err != nil {
		return err
	}

	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				// Skip files that can't be copied (like LOCK files)
				if !os.IsPermission(err) && !os.IsNotExist(err) {
					continue
				}
			}
		}
	}

	return nil
}

// copyFile copies a single file
func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0600)
}

// RecoverFromCorruption attempts to recover from database corruption
func (mm *MigrationManager) RecoverFromCorruption(encryptionKey []byte) error {
	dbPath := filepath.Join(mm.dataPath, "encrypted_db")

	// Create BadgerDB options for recovery
	opts := badger.DefaultOptions(dbPath)
	opts.EncryptionKey = encryptionKey
	opts.IndexCacheSize = 100 << 20 // 100 MB

	// Try to open database in read-only mode
	opts.ReadOnly = true
	db, err := badger.Open(opts)
	if err != nil {
		// If read-only fails, try garbage collection
		fmt.Println("[Migration] Attempting garbage collection...")
		opts.ReadOnly = false
		db, err = badger.Open(opts)
		if err != nil {
			return fmt.Errorf("failed to open database for recovery: %w", err)
		}
		defer db.Close()

		// Run garbage collection
		for {
			if err := db.RunValueLogGC(0.5); err != nil {
				if err == badger.ErrNoRewrite {
					break
				}
				return fmt.Errorf("garbage collection failed: %w", err)
			}
		}

		return nil
	}

	db.Close()
	return nil
}
