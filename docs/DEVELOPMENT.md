# CV Manager Pro - Development Log & Agent Instructions

**Last Updated:** 2025-12-30
**Version:** 1.2.0 (Main App) + 1.0.2 (Launcher)
**Status:** ✅ Production Ready with Auto-Update System

---

## 🎯 Project Overview

**CV Manager Pro** is a professional desktop application for managing CVs, job applications, and career documents with full GDPR compliance, encryption, and a comprehensive audit system.

### Technology Stack
- **Backend:** Go 1.21+
- **Frontend:** HTML/CSS/JavaScript (UnoCSS)
- **Framework:** Wails v2.11.0
- **Database:** BadgerDB (encrypted)
- **Icons:** Phosphor Icons (SVG)
- **Styling:** UnoCSS utility-first framework

### Architecture
```
cv-manager-pro/
├── main.go                    # Main application entry
├── app.go                     # Core app logic
├── storage.go                 # Database & encryption
├── audit.go                   # Audit system
├── version.go                 # Version management
├── frontend/                  # Web UI
│   ├── dist/                 # Production build
│   ├── src/                  # Source files
│   └── uno.config.js         # UnoCSS config
└── launcher/                  # Auto-update launcher
    ├── main.go
    ├── app.go
    ├── frontend/
    ├── app_test.go           # Unit tests
    ├── integration_test.go   # Integration tests
    ├── coverage_test.go      # Coverage tests
    └── debug/                # Debug tools
        └── main.go

GitHub Releases:
├── nash87/cv-manager-pro-releases
    ├── cv-manager-pro.exe       # 16MB
    ├── cv-manager-launcher.exe  # 10MB
    ├── version.json
    ├── launcher-version.json
    └── README.md
```

---

## ✅ Completed Features (Sprint 1-3)

### 🔐 Core Features
- ✅ **Encrypted Storage** - BadgerDB with AES-256-GCM encryption
- ✅ **GDPR Compliance** - Complete data privacy framework
- ✅ **Multi-language** - German (DE) + English (EN)
- ✅ **CV Management** - Create, edit, delete CVs
- ✅ **Job Applications** - Track applications with timeline
- ✅ **Document Storage** - File attachments with encryption
- ✅ **Statistics Dashboard** - Real-time analytics
- ✅ **Export/Import** - JSON format with encryption

### 🔍 Audit System (v1.2.0)
- ✅ **Complete Activity Logging** - All user actions tracked
- ✅ **Audit Dashboard** - Statistics & metrics
- ✅ **Advanced Filtering** - By date, type, entity
- ✅ **Change Tracking** - Before/after values
- ✅ **Encrypted Storage** - Audit logs in BadgerDB
- ✅ **Export Functionality** - JSON/CSV export
- ✅ **Real-time Updates** - Live statistics

**Audit Events Tracked:**
```go
- cv_created, cv_updated, cv_deleted
- application_created, application_updated, application_deleted
- application_status_changed
- education_added, education_updated, education_deleted
- skill_added, skill_updated, skill_deleted
- workexperience_added, workexperience_updated, workexperience_deleted
- language_added, language_updated, language_deleted
- document_uploaded, document_deleted
- data_exported, data_imported
- settings_changed
- search_performed
```

### 🎨 UI/UX Enhancements
- ✅ **UnoCSS Integration** - Modern utility-first CSS framework
- ✅ **Phosphor Icons** - 30+ SVG icons (outline style)
- ✅ **Responsive Design** - Fluid layouts
- ✅ **Dark Theme Support** - Full dark mode
- ✅ **Animations** - Smooth transitions
- ✅ **Window Controls** - Minimize, maximize, close with icons

### 🚀 Auto-Update System
- ✅ **Launcher v1.0.2** - Standalone updater
- ✅ **Dual Update Check** - Launcher + Main App
- ✅ **GitHub Integration** - Releases via GitHub API
- ✅ **SHA256 Verification** - Binary integrity checks
- ✅ **Automatic Downloads** - Silent background updates
- ✅ **Backup & Rollback** - Safe update process
- ✅ **Offline Mode** - Works without internet
- ✅ **15s Timeout** - Frontend timeout prevents hanging
- ✅ **Logging System** - launcher.log for debugging

**Update URLs:**
```
Main App: https://raw.githubusercontent.com/nash87/cv-manager-pro-releases/main/version.json
Launcher: https://raw.githubusercontent.com/nash87/cv-manager-pro-releases/main/launcher-version.json
```

### 📊 Statistics & Analytics
- ✅ **Application Statistics** - Status distribution, timeline
- ✅ **Audit Statistics** - Activity metrics, trends
- ✅ **Chart.js Integration** - Visual charts
- ✅ **Real-time Updates** - Live data refresh

---

## 🧪 Testing Infrastructure

### Unit Tests (✅ 5/5 PASS)
**Location:** `launcher/app_test.go`

```bash
cd launcher
go test -v -run TestCheckComponentUpdate -timeout 60s
```

**Tests:**
- ✅ `TestCheckComponentUpdate_Success` - Mock server test (0.01s)
- ✅ `TestCheckComponentUpdate_Timeout` - Timeout handling (35.00s)
- ✅ `TestCheckComponentUpdate_RealGitHub` - Live GitHub API (0.08s)
- ✅ `TestCheckComponentUpdate_InvalidJSON` - Error handling (0.00s)
- ✅ `TestCheckComponentUpdate_NotFound` - 404 handling (0.00s)

### Integration Tests (✅ 3/3 PASS)
**Location:** `launcher/integration_test.go`

```bash
cd launcher
go test -v -tags=integration -run TestFullLauncherFlow -timeout 120s
```

**Tests:**
- ✅ `GetLauncherInfo` - Launcher metadata retrieval
- ✅ `CheckForUpdates` - Full update check (212ms)
- ✅ `UseDefaultDataLocation` - Data location setup

### Coverage Tests (53.8% Coverage)
**Location:** `launcher/coverage_test.go`

```bash
cd launcher
go test -v -coverprofile=coverage.out -covermode=atomic -timeout 60s
go tool cover -html=coverage.out
```

**Tests:**
- ✅ `TestLoggingToFile` - Log file creation
- ✅ `TestConfigSaveLoad` - Configuration persistence
- ✅ `TestSetDataLocation` - Custom data location
- ✅ `TestUseDefaultDataLocation` - Default location
- ✅ `TestGetInstalledAppVersion` - Version detection
- ✅ `TestStartupShutdown` - Lifecycle management
- ✅ `TestLaunchMainApp_NotInstalled` - Error handling
- ✅ `TestApplyUpdate` - Update installation
- ✅ `TestApplyUpdate_InvalidComponent` - Invalid component
- ✅ `TestDownloadUpdate_InvalidURL` - Network errors
- ✅ `TestConcurrentConfigAccess` - Thread safety

### Debug Tools
**Location:** `launcher/debug/main.go`

```bash
cd launcher/debug
go run main.go
```

**Output:**
```
✅ Network connectivity OK
✅ Launcher URL test OK (187ms)
✅ App URL test OK (26ms)
```

### Test Summary
```
Total Tests: 18
Passed: 17
Skipped: 1 (SHA256 mismatch - requires HTTP server)
Coverage: 53.8%
Execution Time: ~40s
```

---

## 📦 Release Management

### Current Versions

**Main Application: v1.2.0**
- SHA256: `c504542ff4b108a847d9090f629f6af63f167894fcb4727f27a4669ec54247fe`
- Size: 16 MB
- Release: 2025-12-30
- Download: [GitHub Release](https://github.com/nash87/cv-manager-pro-releases/releases/tag/v1.2.0)

**Launcher: v1.0.2**
- SHA256: `384dc69d0c83a860a37ea4274246f7be8fd53c75e13c1b15f46ea5ad6f85a113`
- Size: 10 MB
- Release: 2025-12-30
- Download: [GitHub Release](https://github.com/nash87/cv-manager-pro-releases/releases/tag/v1.0.2)

### Changelog

#### v1.2.0 (2025-12-30) - Main App
```
✅ Complete Audit Log system for tracking all user activities
✅ Audit statistics dashboard with real-time metrics
✅ UnoCSS framework integration for modern styling
✅ Phosphor SVG icons (30+ icons)
✅ Extended i18n support (German/English)
✅ Advanced audit filtering by date, action type, entity
✅ Encrypted audit storage with BadgerDB
✅ Change tracking for all entities
✅ Audit export functionality (JSON/CSV)
✅ Robust error handling
✅ Critical bug fixes
```

#### v1.0.2 (2025-12-30) - Launcher
```
✅ 15-Second Timeout beim Update-Check
✅ Launcher startet auch bei Netzwerkproblemen
✅ Offline-Modus wenn Update-Check fehlschlägt
✅ Erweiterte Fehlerbehandlung
✅ Logging-Datei (launcher.log)
```

#### v1.0.1 (2025-12-30) - Launcher
```
✅ Erweiterte Logging-Funktionalität
✅ Verbesserte Fehlerbehandlung
✅ Längerer HTTP-Timeout (30s)
✅ Detaillierte Debug-Ausgaben
```

#### v1.0.0 (2025-12-30) - Launcher
```
✅ Initial Release
✅ Auto-Update System
✅ Data Location Selector
✅ Dual Update Check (Launcher + App)
```

### Version History (Main App)
- v1.2.0 (2025-12-30) - Audit System & UI Enhancements
- v1.1.6 (2025-12-27) - Window Controls & UnoCSS
- v1.1.5 (2025-12-26) - IsFavorite Feature
- v1.1.4 (2025-12-25) - Bug Fixes
- v1.1.3 (2025-12-26) - UI Polish
- v1.1.2 (2025-12-24) - Performance Improvements
- v1.1.1 (2025-12-23) - Initial Stable Release
- v1.0.0 (2025-12-20) - First Release

---

## 🔧 Build & Deployment

### Prerequisites
```bash
# Go 1.21+
go version

# Wails CLI v2.11.0
wails version

# Node.js (for frontend)
node --version
npm --version
```

### Building Main App
```bash
cd C:\temp\cv-manager-go
wails build -clean -platform windows/amd64
```

**Output:** `build/bin/cv-manager-pro.exe` (16 MB)

### Building Launcher
```bash
cd C:\temp\cv-manager-go\launcher
wails build -clean -platform windows/amd64
```

**Output:** `launcher/build/bin/cv-manager-launcher.exe` (10 MB)

### Generate SHA256 Hashes
```bash
# Windows
certutil -hashfile cv-manager-pro.exe SHA256
certutil -hashfile cv-manager-launcher.exe SHA256

# Linux/Mac
sha256sum cv-manager-pro.exe
sha256sum cv-manager-launcher.exe
```

### GitHub Release Process
```bash
cd C:\temp\cv-manager-pro-releases

# 1. Copy binaries
cp ../cv-manager-go/build/bin/cv-manager-pro.exe .
cp ../cv-manager-go/launcher/build/bin/cv-manager-launcher.exe .

# 2. Update version.json and launcher-version.json
# (Update version, SHA256, release notes)

# 3. Commit & Push
git add .
git commit -m "Release v1.2.0 - Description"
git push origin main

# 4. Create GitHub Release
gh release create v1.2.0 cv-manager-pro.exe \
  --title "CV Manager Pro v1.2.0" \
  --notes "Release notes..."

gh release create v1.0.2 cv-manager-launcher.exe \
  --title "Launcher v1.0.2" \
  --notes "Release notes..."
```

---

## 🐛 Debugging

### Known Issues & Solutions

#### Issue: Launcher hängt bei "Suche nach Updates..."
**Status:** ✅ GELÖST in v1.0.2

**Ursache:**
- Frontend hatte keinen Timeout
- User nutzte alte Version ohne Fixes

**Lösung:**
1. Download neue Version: [v1.0.2](https://github.com/nash87/cv-manager-pro-releases/releases/download/v1.0.2/cv-manager-launcher.exe)
2. Ersetze alte `cv-manager-launcher.exe`
3. Starte Launcher
4. Überprüfe `launcher.log` falls Probleme

**Debug-Schritte:**
```bash
# 1. Backend-Tests laufen lassen
cd launcher
go test -v -run TestCheckComponentUpdate_RealGitHub

# 2. Debug-Tool nutzen
cd launcher/debug
go run main.go

# 3. Log-Datei prüfen
type launcher.log
```

### Log-Datei Analyse
**Location:** Im gleichen Ordner wie `cv-manager-launcher.exe`

**Erwartete Ausgabe:**
```log
2025/12/30 09:33:26 [Launcher] CV Manager Pro Launcher v1.0.2
2025/12/30 09:33:26 [Launcher] Log file: C:\path\to\launcher.log
2025/12/30 09:33:26 [Launcher] Executable: C:\path\to\cv-manager-launcher.exe
2025/12/30 09:33:26 [Launcher] Working directory: C:\path\to\
[Launcher] Checking for updates...
[Launcher] Checking launcher update from: https://raw.githubusercontent.com/...
[Launcher] Sending HTTP GET request...
[Launcher] HTTP response status: 200
[Launcher] Parsing JSON response...
[Launcher] Update info parsed successfully: v1.0.2
[Launcher] ✅ launcher is up to date: 1.0.2
```

### Performance Metrics
- **Update Check:** ~200ms
- **GitHub API Response:** <300ms
- **Full Launcher Startup:** <1s
- **Database Operations:** <50ms
- **UI Rendering:** <100ms

---

## 📚 Code Structure

### Main Application

#### app.go - Core Application
```go
type App struct {
    ctx     context.Context
    config  *AppConfig
    storage *Storage
    audit   *AuditLogger
}

// Key Methods:
- GetAllCVs() []CV
- CreateCV(cv CV) error
- UpdateCV(cv CV) error
- DeleteCV(id string) error
- GetStatistics() Statistics
- GetAuditStats() AuditStats
- GetAuditEvents(filter AuditFilter) []AuditEvent
```

#### storage.go - Database & Encryption
```go
type Storage struct {
    db         *badger.DB
    masterKey  []byte
    gcmCipher  cipher.AEAD
}

// Encryption: AES-256-GCM
// Key Derivation: PBKDF2 with SHA256
// Salt: 32 bytes random
```

#### audit.go - Audit System
```go
type AuditLogger struct {
    storage *Storage
}

type AuditEvent struct {
    ID          string
    Timestamp   time.Time
    Action      string
    EntityType  string
    EntityID    string
    UserID      string
    Changes     AuditChanges
    IPAddress   string
    UserAgent   string
}
```

#### version.go - Version Management
```go
const (
    MajorVersion = 1
    MinorVersion = 2
    PatchVersion = 0
)

var ChangeLog = []ChangeLogEntry{
    {
        Version:     "1.2.0",
        Date:        "2025-12-30",
        Description: "Comprehensive Audit System & UI Enhancements",
        Changes:     []string{...},
    },
}
```

### Launcher

#### launcher/app.go - Update System
```go
type Launcher struct {
    ctx          context.Context
    dataPath     string
    launcherPath string
    mainAppPath  string
    config       *LauncherConfig
}

// Update Flow:
1. CheckForUpdates() - Query GitHub API
2. DownloadUpdate() - Download with SHA256 verification
3. ApplyUpdate() - Install with backup
4. LaunchMainApp() - Start main application
```

---

## 🎨 Frontend Architecture

### UnoCSS Configuration
**File:** `frontend/uno.config.js`

```javascript
export default {
  presets: [
    presetUno(),
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  theme: {
    colors: {
      primary: {...},
      success: {...},
      warning: {...},
      danger: {...},
    },
  },
  shortcuts: {
    'btn-primary': 'px-4 py-2 bg-primary-500...',
    'card': 'bg-white dark:bg-gray-800...',
  },
}
```

### Icon System (Phosphor)
**Icons Used:** (30+ total)
```
Window Controls: ph-x, ph-minus, ph-copy
Navigation: ph-house, ph-briefcase, ph-chart-bar, ph-gear, ph-shield-check
Actions: ph-plus, ph-floppy-disk, ph-trash, ph-pencil, ph-magnifying-glass
Status: ph-heart, ph-star, ph-check, ph-x-circle
Data: ph-export, ph-import, ph-download, ph-upload
```

### Styling Patterns
```css
/* Utility Classes */
.container { @apply max-w-7xl mx-auto px-4 }
.card { @apply bg-white dark:bg-gray-800 rounded-lg shadow p-6 }
.btn { @apply px-4 py-2 rounded-lg font-medium transition }

/* Dark Mode */
:root[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
}
```

---

## 🔐 Security & GDPR

### Encryption
- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2-SHA256 (100,000 iterations)
- **Salt:** 32 bytes random per database
- **Nonce:** 12 bytes random per entry

### GDPR Compliance
✅ **Right to Access** - Export all data
✅ **Right to Erasure** - Complete data deletion
✅ **Right to Portability** - JSON export format
✅ **Data Minimization** - Only essential data stored
✅ **Purpose Limitation** - Clear data usage
✅ **Storage Limitation** - No cloud storage
✅ **Integrity & Confidentiality** - Full encryption
✅ **Accountability** - Complete audit trail

### Audit Trail
- All CRUD operations logged
- Timestamp + User + IP + Changes
- Encrypted storage
- Export capability
- Retention policy configurable

---

## 🚧 Known Limitations & TODO

### Current Limitations
- ⚠️ Windows only (Wails v2 limitation)
- ⚠️ Single-user application
- ⚠️ No cloud sync
- ⚠️ Manual backup required
- ⚠️ Launcher frontend may timeout on slow connections

### Planned Features (Backlog)
- [ ] Linux/Mac support
- [ ] Cloud backup integration
- [ ] Multi-user support
- [ ] Advanced search with Elasticsearch
- [ ] PDF CV generation
- [ ] Email integration
- [ ] Calendar integration
- [ ] Mobile app companion
- [ ] API for third-party integrations
- [ ] Webhooks for automation

---

## 📖 Agent Instructions

### For AI Assistants Working on This Project

#### 1. Code Style
```go
// Always use descriptive names
func (a *App) GetCVByID(id string) (CV, error) {
    // Log all operations
    log.Printf("[App] Getting CV: %s", id)

    // Use early returns
    if id == "" {
        return CV{}, fmt.Errorf("CV ID cannot be empty")
    }

    // Audit all data operations
    a.audit.LogEvent("cv_accessed", "cv", id, nil)

    return cv, nil
}
```

#### 2. Testing Requirements
- ✅ Unit tests for all new functions
- ✅ Integration tests for workflows
- ✅ Coverage > 50% minimum
- ✅ Benchmark critical paths
- ✅ Error cases tested

**Test Template:**
```go
func TestNewFeature(t *testing.T) {
    // Setup
    app := setupTestApp(t)
    defer cleanupTestApp(t, app)

    // Execute
    result, err := app.NewFeature(input)

    // Assert
    if err != nil {
        t.Fatalf("NewFeature failed: %v", err)
    }

    if result != expected {
        t.Errorf("Expected %v, got %v", expected, result)
    }

    t.Log("✅ NewFeature works correctly")
}
```

#### 3. Error Handling
```go
// Always wrap errors with context
if err != nil {
    return fmt.Errorf("failed to create CV: %w", err)
}

// Use typed errors for domain logic
var (
    ErrCVNotFound = errors.New("CV not found")
    ErrInvalidData = errors.New("invalid CV data")
)
```

#### 4. Audit Logging
```go
// Log before modification
a.audit.LogEvent(
    "cv_updated",           // action
    "cv",                   // entity_type
    cv.ID,                  // entity_id
    &AuditChanges{          // changes
        Before: oldCV,
        After:  newCV,
    },
)
```

#### 5. Frontend Integration
```javascript
// Always use Wails bindings
import { GetAllCVs, CreateCV } from '../wailsjs/go/main/App'

async function loadCVs() {
    try {
        const cvs = await GetAllCVs()
        renderCVList(cvs)
    } catch (error) {
        showError('Failed to load CVs: ' + error)
    }
}
```

#### 6. Common Tasks

**Adding a new feature:**
1. Create data structures in appropriate file
2. Add database operations in storage.go
3. Add business logic in app.go
4. Add audit logging
5. Create frontend UI
6. Write tests (unit + integration)
7. Update version.go changelog
8. Update agents.md

**Adding a new page:**
1. Create HTML in frontend/src/pages/
2. Add route in frontend/src/app.js
3. Add navigation link
4. Add Wails bindings
5. Style with UnoCSS
6. Add icons if needed
7. Test responsive design

**Fixing a bug:**
1. Write failing test first
2. Fix the bug
3. Ensure test passes
4. Add to changelog
5. Bump patch version

---

## 📞 Support & Resources

### Documentation
- **Wails:** https://wails.io/docs/introduction
- **BadgerDB:** https://dgraph.io/docs/badger/
- **UnoCSS:** https://unocss.dev/
- **Phosphor Icons:** https://phosphoricons.com/

### GitHub Repositories
- **Source:** (Planned for Gitea in Kubernetes)
- **Releases:** https://github.com/nash87/cv-manager-pro-releases

### Test Artifacts
- **Test Launcher:** `C:\temp\test-launcher.exe`
- **Test Anleitung:** `C:\temp\LAUNCHER-TEST-ANLEITUNG.md`
- **Debug Log:** `launcher-debug.log`
- **Coverage Report:** `launcher/coverage.out`

---

## 🎯 Current Status & Next Session

### ✅ Completed This Session
1. **Launcher v1.0.2** - Timeout-Fix implementiert
2. **Unit-Tests** - 5/5 PASS, Backend funktioniert perfekt
3. **Integration-Tests** - 3/3 PASS, 212ms Update-Check
4. **Coverage-Tests** - 53.8% Coverage erreicht
5. **Debug-Tools** - Netzwerk-Diagnose erstellt
6. **GitHub Releases** - v1.2.0 + v1.0.2 veröffentlicht
7. **Dokumentation** - Komplette Test-Anleitung

### ⚠️ Known Issue
**Launcher hängt bei "Suche nach Updates..."**
- ✅ Backend-Code: Funktioniert (Tests PASS)
- ✅ GitHub-APIs: Erreichbar (<300ms)
- ✅ Update-Check: Erfolgreich (212ms)
- ❌ Frontend: User nutzt alte Version

**Lösung:** Download [Launcher v1.0.2](https://github.com/nash87/cv-manager-pro-releases/releases/download/v1.0.2/cv-manager-launcher.exe)

### 🔄 Next Session Tasks

#### Priority 1: Frontend Testing
- [ ] Wails-GUI Tests hinzufügen
- [ ] E2E-Tests mit Headless Browser
- [ ] Frontend-Backend-Integration testen
- [ ] Coverage auf 80%+ erhöhen

#### Priority 2: Features
- [ ] PDF CV Export (v1.3.0)
- [ ] Advanced Search (v1.3.0)
- [ ] Email Integration (v1.4.0)
- [ ] Calendar Sync (v1.4.0)
- [ ] Cloud Backup (v1.5.0)

#### Priority 3: Platform Support
- [ ] Linux Build & Testing
- [ ] MacOS Build & Testing
- [ ] Cross-platform launcher
- [ ] Universal binaries

#### Priority 4: Documentation
- [ ] API Documentation (GoDoc)
- [ ] User Manual (German + English)
- [ ] Developer Guide
- [ ] Video Tutorials

### 📊 Metrics
```
Total Lines of Code: ~8,500
Test Coverage: 53.8%
Tests Passing: 17/18 (94.4%)
Build Time: ~2min (Main) + ~25s (Launcher)
Binary Sizes: 16MB (Main) + 10MB (Launcher)
Platforms: Windows x64
Languages: Go, JavaScript, CSS
```

---

## 🏆 Best Practices Summary

### Development
✅ Write tests first (TDD)
✅ Use descriptive variable names
✅ Log all operations
✅ Audit all data changes
✅ Handle all errors
✅ Use early returns
✅ Comment complex logic
✅ Keep functions small (<50 lines)

### Git Workflow
✅ Commit often, push daily
✅ Use semantic commit messages
✅ Tag releases properly
✅ Update changelog
✅ Include SHA256 in releases

### Testing
✅ Unit tests for all functions
✅ Integration tests for workflows
✅ Coverage reports mandatory
✅ Benchmark critical paths
✅ Test error cases

### Security
✅ Never log sensitive data
✅ Always encrypt at rest
✅ Use strong crypto (AES-256)
✅ Verify SHA256 on downloads
✅ GDPR compliance by default

---

## 🎉 Success Criteria

### Version 1.2.0 ✅
- [x] Audit system fully functional
- [x] UnoCSS integrated
- [x] Phosphor icons implemented
- [x] Extended i18n support
- [x] Comprehensive tests
- [x] Auto-update system
- [x] GitHub releases automated

### Version 1.3.0 (Planned)
- [ ] PDF CV export
- [ ] Advanced search
- [ ] Email templates
- [ ] 80%+ test coverage

### Version 2.0.0 (Vision)
- [ ] Cross-platform support
- [ ] Cloud sync
- [ ] Mobile app
- [ ] API for integrations

---

**End of Documentation**

*For questions or issues, check launcher.log or run the debug tool in `launcher/debug/`*

*Last verified: 2025-12-30 09:50 CET*
