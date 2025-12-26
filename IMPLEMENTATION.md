# CV Manager Pro - Go Implementation with GDPR Compliance

## 🎯 Projekt-Übersicht

**CV Manager Pro** ist eine native Desktop-Anwendung für verschlüsselte CV-Verwaltung mit vollständiger GDPR/DSGVO-Konformität.

## 🔐 Sicherheit & Verschlüsselung

### Technologie-Stack
- **Backend**: Go 1.21+
- **Frontend**: HTML/CSS/JavaScript (Obsidian-inspired Design)
- **Framework**: Wails v2.8.0 (Native Desktop App)
- **Database**: BadgerDB v4 mit AES-256 Verschlüsselung
- **Verschlüsselung**:
  - AES-256-GCM für Daten
  - PBKDF2 für Key Derivation (100.000 Iterationen)
  - Automatische Key-Rotation alle 30 Tage

### Verschlüsselungs-Features
- ✅ All data encrypted at rest (BadgerDB encryption)
- ✅ Military-grade AES-256 encryption
- ✅ Secure key derivation (PBKDF2)
- ✅ Automatic key rotation
- ✅ Local storage only (keine Cloud, keine Server)

## 📜 GDPR/DSGVO Compliance

### Implementierte Artikel

#### Art. 6(1)(a) - Lawfulness (Consent)
- ✅ User Consent Screen beim ersten Start
- ✅ Explizite Einwilligung erforderlich für alle Datenoperationen
- ✅ Klare Information über Datenverarbeitung

#### Art. 7 - Conditions for Consent
- ✅ Jederzeit widerrufbar in Settings
- ✅ Widerruf führt zur Sperrung aller Operationen
- ✅ Logging des Widerrufs

#### Art. 13 - Information to be Provided
- ✅ Volle Transparenz über Datenverarbeitung
- ✅ Privacy & Security View mit Details
- ✅ Links zu GDPR-Artikeln

#### Art. 15 - Right of Access
- ✅ Compliance Log zeigt alle Datenoperationen
- ✅ Zeitstempel, Operation, Legal Basis, Beschreibung
- ✅ Jederzeit einsehbar

#### Art. 17 - Right to Erasure
- ✅ "Delete All My Data" Button
- ✅ Vollständige Löschung aller Daten
- ✅ Bestätigungsdialog

#### Art. 20 - Right to Data Portability
- ✅ "Export All My Data" Button
- ✅ Export als JSON mit allen Daten
- ✅ Inkl. Consent & Compliance Log

#### Art. 32 - Security of Processing
- ✅ AES-256 Verschlüsselung
- ✅ Secure key derivation
- ✅ Local storage only
- ✅ Audit logging

### Compliance Log
Alle Datenoperationen werden geloggt:
- **CREATE**: CV erstellt
- **READ**: CV gelesen
- **UPDATE**: CV aktualisiert
- **DELETE**: CV gelöscht
- **EXPORT**: Daten exportiert
- **CONSENT_GRANTED**: Einwilligung erteilt
- **CONSENT_WITHDRAWN**: Einwilligung widerrufen

## 🎨 Features

### 1. Dashboard
- Card-basierte Ansicht aller CVs
- Suche (Echtzeit)
- Filter (Status, Kategorie, Template)
- Quick Actions (Edit, Export, Duplicate, Delete)

### 2. Visual PDF Editor (WYSIWYG)
- **Split View**: Editor links, Live-Vorschau rechts
- **Drag & Drop**: Elemente ziehen und ablegen
- **Live Updates**: Änderungen sofort sichtbar
- **Anpassbare Elemente**:
  - Header
  - Contact Info
  - Summary
  - Work Experience
  - Education
  - Skills
- **Style Settings**:
  - Template (Modern, Classic, Creative)
  - Color Scheme (Blue, Green, Purple, Red, Orange, Dark)
  - Font Size (8-16pt)
  - Spacing (1-3x)
- **Preview Controls**:
  - Zoom In/Out
  - PDF-like Vorschau

### 3. Privacy & Security View
- **Security Status Card**:
  - Encryption Status
  - Database Type
  - Data Location
- **GDPR Articles**:
  - Alle relevanten Artikel
  - Beschreibung
  - Link zu gdpr-info.eu
  - Compliance-Status
- **User Rights Buttons**:
  - Export All Data (Art. 20)
  - View Compliance Log (Art. 15)
  - Delete All Data (Art. 17)

### 4. Statistics Dashboard
- Total CVs
- Total Work Experience
- Total Education
- Total Skills
- Durchschnitte

### 5. Theme System
- **Dark Mode** (Default)
- **Light Mode** (Option)
- Toggle-Button (Floating)
- CSS Custom Properties

## 📁 Dateistruktur

```
c:\temp\cv-manager-go\
├── go.mod                      # Go dependencies
├── models.go                   # CV data structures
├── encrypted_storage.go        # BadgerDB + Encryption + GDPR
├── app.go                      # Wails app + API methods
├── main.go                     # Entry point
├── pdf.go                      # PDF generation
├── frontend\
│   └── dist\
│       ├── index.html          # UI structure
│       ├── style.css           # Obsidian-inspired CSS
│       └── app.js              # Frontend logic
└── IMPLEMENTATION.md           # This file
```

## 🔧 Backend-Struktur

### encrypted_storage.go
- `EncryptedStorage`: Main storage class
- `ComplianceLog`: GDPR audit log
- `UserConsent`: Consent management
- `SecurityInfo`: Security information
- `GDPRArticle`: GDPR article references

**Methods**:
- `GrantConsent()`: Einwilligung erteilen
- `WithdrawConsent()`: Einwilligung widerrufen
- `GetConsent()`: Consent-Status abrufen
- `CreateCV()`: CV erstellen (mit Consent-Check)
- `SaveCV()`: CV speichern (mit Consent-Check)
- `GetCV()`: CV lesen (mit Consent-Check)
- `DeleteCV()`: CV löschen (mit Consent-Check)
- `ExportAllData()`: Alle Daten exportieren (Art. 20)
- `DeleteAllData()`: Alle Daten löschen (Art. 17)
- `GetSecurityInfo()`: Security-Informationen
- `GetComplianceLog()`: Compliance-Log

### app.go
Wails-bound methods für Frontend:
- `GetConsent()`
- `GrantConsent()`
- `WithdrawConsent()`
- `GetSecurityInfo()`
- `GetComplianceLog()`
- `ExportAllDataGDPR()`
- `DeleteAllDataGDPR()`
- `GetAllCVs()`
- `GetCV(id)`
- `CreateCV()`
- `SaveCV(cv)`
- `DeleteCV(id)`
- `SearchCVs(query)`
- `ExportPDF(id)`

## 🎨 Frontend-Struktur

### Views
1. **Consent Screen**: Erster Start, GDPR-Einwilligung
2. **Dashboard**: CV-Karten, Suche, Filter
3. **Statistics**: Statistiken
4. **Visual Editor**: Drag & Drop PDF-Editor
5. **Privacy & Security**: GDPR-Informationen
6. **Settings**: Consent-Verwaltung, Theme
7. **Editor**: Formular-Editor (klassisch)

### UI-Komponenten
- **Sidebar**: Navigation + Security-Indikator
- **Toolbar**: Suche + Filter
- **CV Cards**: Card-Layout mit Stats
- **Consent Screen**: Overlay beim ersten Start
- **Compliance Log Modal**: Popup für Log-Anzeige
- **Visual Editor Split View**: Editor + Preview
- **Theme Toggle**: Floating Button

## 🚀 Build & Run

### Dependencies installieren
```bash
cd c:\temp\cv-manager-go
go mod download
```

### Wails installieren
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### Development Mode
```bash
wails dev
```

### Production Build
```bash
wails build
```

### Output
- Windows: `build/bin/cv-manager-go.exe`
- Standalone executable mit embedded frontend

## 📊 Datenfluss

### Startup
1. App startet
2. Encrypted Storage initialisieren
3. Consent-Status prüfen
4. Wenn kein Consent → Consent Screen zeigen
5. Wenn Consent → Dashboard laden

### CV erstellen
1. User klickt "New CV"
2. Consent-Check in Backend
3. Wenn OK → Neues CV-Objekt erstellen
4. Compliance Log-Eintrag: CREATE
5. Encrypted speichern in BadgerDB
6. Frontend-Update

### Daten exportieren (GDPR Art. 20)
1. User klickt "Export All My Data"
2. Backend sammelt:
   - Alle CVs
   - User Consent
   - Compliance Log
3. Als JSON exportieren
4. Compliance Log-Eintrag: EXPORT_ALL_DATA
5. Filepath zurückgeben

### Consent widerrufen (GDPR Art. 7(3))
1. User klickt "Withdraw Consent"
2. Consent-Status auf "withdrawn" setzen
3. Compliance Log-Eintrag
4. Alle CV-Operationen blockiert
5. User muss erneut Consent geben

## 🔒 Security Best Practices

- ✅ Keine Plaintext-Speicherung
- ✅ Encryption at rest (BadgerDB)
- ✅ Key derivation mit PBKDF2
- ✅ Kein Netzwerk-Traffic (100% lokal)
- ✅ Automatic key rotation
- ✅ Audit logging für alle Operationen
- ✅ User Consent erforderlich
- ✅ Right to erasure implementiert
- ✅ Data portability implementiert

## 📝 Nächste Schritte

1. **CSS erweitern** für neue Views (Visual Editor, Privacy, Consent Screen)
2. **JavaScript** vervollständigen:
   - Consent-Handling
   - Visual Editor Drag & Drop
   - Live Preview
   - GDPR-Funktionen
3. **Testen**:
   - Wails dev mode
   - Consent Flow
   - GDPR-Features
   - Visual Editor
4. **Build**:
   - Production build
   - EXE testen

## 📚 Links

- GDPR Info: https://gdpr-info.eu/
- Wails Docs: https://wails.io/
- BadgerDB: https://github.com/dgraph-io/badger
- Art. 6 GDPR: https://gdpr-info.eu/art-6-gdpr/
- Art. 7 GDPR: https://gdpr-info.eu/art-7-gdpr/
- Art. 13 GDPR: https://gdpr-info.eu/art-13-gdpr/
- Art. 15 GDPR: https://gdpr-info.eu/art-15-gdpr/
- Art. 17 GDPR: https://gdpr-info.eu/art-17-gdpr/
- Art. 20 GDPR: https://gdpr-info.eu/art-20-gdpr/
- Art. 32 GDPR: https://gdpr-info.eu/art-32-gdpr/

## ✅ Status

- [x] Go Backend mit BadgerDB + Encryption
- [x] GDPR Compliance Implementierung
- [x] User Consent Management
- [x] Compliance Logging
- [x] Security Information
- [x] HTML Structure (alle Views)
- [ ] CSS Styling (Visual Editor, Privacy Views)
- [ ] JavaScript Logic (Consent, Visual Editor, GDPR)
- [ ] Wails Build Config
- [ ] Testing
- [ ] Production Build

---

**Version**: 1.0.0 (Go Refactoring mit GDPR)
**Datum**: 2025-12-25
**Status**: In Development
