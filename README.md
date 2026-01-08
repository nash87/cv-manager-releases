# CV Manager - Releases Repository

Dieses Repository enthält die kompilierten Binaries für CV Manager.

---

## 📦 Aktuelle Versionen

| Komponente | Version | Datum | Download |
|------------|---------|-------|----------|
| **App** | v1.4.8 | 2026-01-08 | [cv-manager.exe](https://github.com/nash87/cv-manager-releases/raw/main/cv-manager.exe) (17 MB) |
| **Launcher** | v1.3.3 | 2026-01-08 | [cv-manager-launcher.exe](https://github.com/nash87/cv-manager-releases/raw/main/cv-manager-launcher.exe) (10 MB) |

---

## 🚀 Latest Release: v1.4.8 (2026-01-08)

### App v1.4.8 - Portable Fix & Debug Logging
- 🐛 **FIX:** Kritischer Bug behoben - DB wurde bei jedem Start gelöscht
- 🐛 **FIX:** Datenbank-Initialisierung hängt nicht mehr
- 📝 **NEW:** Umfassendes Debug-Logging-System für Fehleranalyse
- ⚙️ **NEW:** Debug-Modus im Launcher aktivierbar
- ⚡ **IMPROVED:** Schnellere DB-Initialisierung (optimierte Badger-Optionen)
- ⏱️ **IMPROVED:** Timeout auf 5 Sekunden erhöht für langsamere Systeme
- 🔒 **IMPROVED:** Automatische Consent-Aktivierung für portable Nutzung
- 📊 **NEW:** Debug-Statistiken und Log-Pfad abrufbar

### Launcher v1.3.3
- ⚙️ **NEW:** Debug-Modus Support für Hauptapp
- 🔄 Übergibt `CV_MANAGER_DEBUG=1` Umgebungsvariable wenn aktiviert

---

## 🔄 Update-Mechanismus

Der **CV Manager Launcher** prüft automatisch bei jedem Start:
1. **Launcher-Updates** via `launcher-version.json`
2. **Hauptapp-Updates** via `version.json`

### version.json Format
```json
{
  "latest_version": "1.4.8",
  "release_date": "2026-01-08",
  "download_url": "https://github.com/nash87/cv-manager-releases/raw/main/cv-manager.exe",
  "changelog_url": "https://github.com/nash87/cv-manager-releases/releases/tag/v1.4.8",
  "release_notes": "Portable Fix & Debug Logging",
  "sha256": "...",
  "size_mb": 17,
  "is_required": true
}
```

---

## 📥 Installation

### Erste Installation
1. Lade beide Dateien herunter:
   - `cv-manager-launcher.exe`
   - `cv-manager-pro.exe`
2. Lege beide in denselben Ordner
3. Starte `cv-manager-launcher.exe`
4. Wähle Speicherort für Daten
5. Launcher startet automatisch die Hauptapp

### Portable Installation
```
cv-manager-pro/              # Dein Ordner (beliebig benennbar)
├── cv-manager-launcher.exe  # ← Dieses starten!
├── cv-manager-pro.exe
├── cv-data/                 # Automatisch erstellt
│   ├── database/
│   ├── exports/
│   ├── backups/
│   └── logs/
└── updates/                 # Temporär für Updates
```

---

## 🔐 Sicherheit

### Checksums
Jedes Release enthält SHA256 Checksums:
- In `checksums.txt`
- In `version.json`
- In `launcher-version.json`

### Verifikation
```bash
# Windows PowerShell
Get-FileHash cv-manager-pro.exe -Algorithm SHA256

# Git Bash / Linux / macOS
sha256sum cv-manager-pro.exe
```

---

## 🔄 Auto-Update

Der Launcher prüft automatisch bei jedem Start:
1. Verbindung zu GitHub
2. Vergleich der Versionen
3. Download bei verfügbaren Updates
4. SHA256-Verifikation
5. Installation
6. Start der aktualisierten App

**Discord-Style:** Updates werden im Hintergrund heruntergeladen und beim nächsten Start installiert.

---

## 📋 Changelog

Siehe [changelog.md](changelog.md) für vollständige Versionshistorie.

---

## ❓ Support

- **Issues:** [GitHub Issues](https://github.com/nash87/cv-manager-pro-releases/issues)
- **Diskussionen:** [GitHub Discussions](https://github.com/nash87/cv-manager-pro-releases/discussions)
- **Email:** support@cvmanager.pro

---

## 📜 Lizenz

MIT License - siehe [LICENSE](LICENSE)

---

**Made with ❤️ and 🔒 by the CV Manager Pro Team**

**Portable · Encrypted · GDPR-Compliant**
