# Launcher Build & Deployment Guide

Komplette Anleitung zum Bauen und Deployen des CV Manager Pro Launchers + Hauptapp.

---

## 📁 Projekt-Struktur (Portable)

```
cv-manager-go/
├── main.go                      # Hauptapp Entry Point
├── app.go                       # Hauptapp Logic
├── models.go                    # Datenmodelle
├── audit.go                     # Audit-System (NEU!)
├── launcher_check.go            # Launcher-Check (NEU!)
├── launcher/                    # Launcher (NEU!)
│   ├── main.go
│   ├── app.go
│   └── frontend/dist/
│       ├── index.html
│       ├── style.css
│       └── app.js
├── frontend/dist/               # Hauptapp Frontend
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── utils.js                 # Utility Functions (NEU!)
│   ├── uno.config.js            # UnoCSS Config (NEU!)
│   ├── phosphor-icons.html      # Icons (NEU!)
│   └── i18n/
│       ├── de.json
│       ├── en.json
│       └── de_extended.json     # Erweiterte i18n (NEU!)
└── github-releases/             # GitHub Repo Content (NEU!)
    ├── version.json
    ├── launcher-version.json
    └── README.md
```

---

## 🔨 Build-Schritte

### 1. Hauptapp bauen

```bash
cd /c/temp/cv-manager-go

# Dependencies installieren
go mod tidy

# Build Hauptapp
wails build

# Output: build/bin/cv-manager-pro.exe
```

### 2. Launcher bauen

```bash
cd /c/temp/cv-manager-go/launcher

# Erstelle go.mod für Launcher
cat > go.mod <<EOF
module launcher

go 1.21

require github.com/wailsapp/wails/v2 v2.8.0
require github.com/google/uuid v1.6.0
EOF

# Dependencies installieren
go mod tidy

# Build Launcher
wails build

# Output: build/bin/cv-manager-launcher.exe
```

### 3. Portable Package erstellen

```bash
# Erstelle Release-Ordner
mkdir -p /c/temp/cv-manager-pro-portable

# Kopiere Executables
cp /c/temp/cv-manager-go/build/bin/cv-manager-pro.exe /c/temp/cv-manager-pro-portable/
cp /c/temp/cv-manager-go/launcher/build/bin/cv-manager-launcher.exe /c/temp/cv-manager-pro-portable/

# Struktur erstellen
cd /c/temp/cv-manager-pro-portable
mkdir -p cv-data/{database,exports,backups,logs}
mkdir -p updates

# Optional: README hinzufügen
cat > README.txt <<EOF
CV Manager Pro - Portable Edition

1. Starte cv-manager-launcher.exe
2. Wähle Speicherort für Daten
3. Launcher prüft automatisch Updates
4. Hauptapp wird gestartet

Alles in diesem Ordner kann auf USB-Stick oder in Cloud verschoben werden!
EOF
```

---

## 📦 Finale Portable Struktur

```
cv-manager-pro-portable/
├── cv-manager-launcher.exe      # ← Dieses starten!
├── cv-manager-pro.exe
├── README.txt
├── cv-data/                     # Automatisch erstellt beim ersten Start
│   ├── database/                # BadgerDB encrypted
│   ├── exports/                 # PDF exports
│   ├── backups/                 # Backups
│   └── logs/                    # Audit logs (NEU!)
├── updates/                     # Temp für Downloads
└── launcher-config.json         # Launcher Config
```

---

## 🔐 SHA256 Checksums generieren

```bash
cd /c/temp/cv-manager-pro-portable

# Windows PowerShell
Get-FileHash cv-manager-pro.exe -Algorithm SHA256 | Select-Object Hash
Get-FileHash cv-manager-launcher.exe -Algorithm SHA256 | Select-Object Hash

# Git Bash / Linux
sha256sum cv-manager-pro.exe
sha256sum cv-manager-launcher.exe

# Checksums speichern
cat > checksums.txt <<EOF
SHA256 Checksums - CV Manager Pro v1.1.7

cv-manager-pro.exe:
$(sha256sum cv-manager-pro.exe | awk '{print $1}')

cv-manager-launcher.exe:
$(sha256sum cv-manager-launcher.exe | awk '{print $1}')

Build Date: $(date)
EOF
```

---

## 🌐 GitHub Releases Setup

### 1. Repository erstellen

```bash
# Neues Repo auf GitHub erstellen:
# Name: cv-manager-pro-releases
# Visibility: Public
# Description: Update files and releases for CV Manager Pro (NO source code)

# Lokal initialisieren
cd /c/temp
mkdir cv-manager-pro-releases
cd cv-manager-pro-releases
git init
git branch -M main
```

### 2. Dateien vorbereiten

```bash
# Kopiere GitHub-Release-Dateien
cp /c/temp/cv-manager-go/github-releases/* .

# Update version.json mit echtem SHA256
SHA256=$(sha256sum /c/temp/cv-manager-pro-portable/cv-manager-pro.exe | awk '{print $1}')
sed -i "s/WIRD_BEIM_BUILD_GENERIERT/$SHA256/" version.json

# Update launcher-version.json
LAUNCHER_SHA256=$(sha256sum /c/temp/cv-manager-pro-portable/cv-manager-launcher.exe | awk '{print $1}')
sed -i "s/WIRD_BEIM_BUILD_GENERIERT/$LAUNCHER_SHA256/" launcher-version.json

# Struktur erstellen
mkdir -p releases/v1.1.7
mkdir -p releases/v1.0.0
```

### 3. Push zu GitHub

```bash
# Remote hinzufügen
git remote add origin https://github.com/nash87/cv-manager-pro-releases.git

# Commit
git add .
git commit -m "🚀 Initial release structure

- v1.1.7: Hauptapp mit Favorites, Error Handling, UnoCSS, Audit
- v1.0.0: Launcher mit Auto-Update"

# Push
git push -u origin main
```

---

## 📤 GitHub Release erstellen

### Via GitHub Web Interface:

1. Gehe zu: https://github.com/nash87/cv-manager-pro-releases/releases
2. Click "Create a new release"
3. Tag: `v1.1.7`
4. Title: `CV Manager Pro v1.1.7`
5. Description:
   ```markdown
   ## ✨ Features
   - ✅ IsFavorite Feature
   - ✅ Robustes Error Handling
   - ✅ UnoCSS Design System
   - ✅ Phosphor Icons
   - ✅ Audit-System (User-Aktivitäten)
   - ✅ Erweiterte i18n

   ## 📦 Downloads
   - **Hauptapp:** cv-manager-pro.exe (45 MB)
   - **Launcher:** cv-manager-launcher.exe (8 MB)

   ## 🔐 SHA256 Checksums
   Siehe checksums.txt
   ```
6. Upload:
   - `cv-manager-pro.exe`
   - `cv-manager-launcher.exe`
   - `checksums.txt`
7. Publish release

### Via GitHub CLI:

```bash
# GitHub CLI installieren: https://cli.github.com/

# Login
gh auth login

# Release erstellen
gh release create v1.1.7 \
  --repo nash87/cv-manager-pro-releases \
  --title "CV Manager Pro v1.1.7" \
  --notes-file release-notes.md \
  /c/temp/cv-manager-pro-portable/cv-manager-pro.exe \
  /c/temp/cv-manager-pro-portable/cv-manager-launcher.exe \
  /c/temp/cv-manager-pro-portable/checksums.txt
```

---

## 🔄 Update-Workflow

### Neue Version veröffentlichen:

1. **Hauptapp bauen** (siehe oben)
2. **SHA256 generieren**
3. **version.json updaten:**
   ```json
   {
     "latest_version": "1.1.8",  // ← Neue Version
     "release_date": "2025-12-31",
     "download_url": "https://github.com/nash87/cv-manager-pro-releases/releases/download/v1.1.8/cv-manager-pro.exe",
     "sha256": "NEUER_SHA256_HIER",
     // ...
   }
   ```
4. **GitHub Release erstellen** (v1.1.8)
5. **version.json pushen** zu main branch
6. **FERTIG!** - Launcher prüft automatisch bei jedem Start

---

## 🧪 Update-System testen

### Lokaler Test:

1. **Fake Update-Server:**
   ```bash
   cd /c/temp/cv-manager-pro-releases
   python -m http.server 8000
   ```

2. **launcher/app.go anpassen:**
   ```go
   // Temporär für Testing
   const (
       AppVersionURL = "http://localhost:8000/version.json"
       LauncherVersionURL = "http://localhost:8000/launcher-version.json"
   )
   ```

3. **Launcher neu bauen & testen**

4. **Nach Test:** URLs wieder auf GitHub ändern

---

## 📋 Checklist für Release

### Pre-Release
- [ ] Alle Features getestet
- [ ] Keine Console-Errors
- [ ] Favoriten funktionieren
- [ ] Error Handling robust
- [ ] Audit-Logs werden erstellt
- [ ] i18n DE/EN funktioniert

### Build
- [ ] Hauptapp gebaut
- [ ] Launcher gebaut
- [ ] SHA256 generiert
- [ ] Portable Package erstellt
- [ ] Checksums.txt erstellt

### GitHub
- [ ] Repository erstellt
- [ ] version.json aktualisiert
- [ ] launcher-version.json aktualisiert
- [ ] Release v1.1.7 erstellt
- [ ] Files hochgeladen
- [ ] README.md gepusht

### Test
- [ ] Launcher startet
- [ ] Data Location Selector funktioniert
- [ ] Update-Check funktioniert
- [ ] Hauptapp startet
- [ ] Audit-Logs werden erstellt
- [ ] Portable (auf USB-Stick getestet)

---

## 🐛 Troubleshooting

### Launcher findet Hauptapp nicht
**Lösung:** Beide `.exe` Dateien müssen im gleichen Ordner liegen.

### Update-Check schlägt fehl
**Lösung:**
- Überprüfe Internet-Verbindung
- Überprüfe GitHub URLs in `launcher/app.go`
- Überprüfe ob `version.json` auf GitHub im main branch ist

### SHA256 Verification failed
**Lösung:**
- SHA256 in `version.json` muss exakt mit der `.exe` Datei übereinstimmen
- Neu generieren: `sha256sum cv-manager-pro.exe`

### Data Directory nicht erstellt
**Lösung:**
- Überprüfe Schreibrechte im Ordner
- Wähle anderen Speicherort

---

## 📈 Versions-Workflow

```
1.1.6 → 1.1.7 (aktuell)
         ↓
      [Sprint 2]
         ↓
      1.1.8 (next)
      - Launcher UnoCSS
      - Launcher i18n
      - Launcher Dark/Light Mode
      - Audit UI im Frontend
```

---

## 🎯 Nächste Schritte

1. **Sprint 2 Fortsetzung:**
   - [ ] Launcher mit UnoCSS
   - [ ] Launcher i18n DE/EN
   - [ ] Launcher Dark/Light Mode
   - [ ] Audit-UI im Frontend
   - [ ] Bulk Export Feature
   - [ ] Import von LinkedIn

2. **CI/CD Setup (optional):**
   - GitHub Actions für automatischen Build
   - Automatische SHA256-Generierung
   - Automatisches Release Publishing

---

**Happy Building! 🚀**

Bei Fragen siehe [SPRINT_2_SUMMARY.md](SPRINT_2_SUMMARY.md) (wird erstellt nach Abschluss).
