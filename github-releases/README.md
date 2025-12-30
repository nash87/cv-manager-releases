# CV Manager Pro - Releases Repository

Dieses Repository enthält **nur** die Update-Daten und kompilierten Binaries für CV Manager Pro.

**KEIN Quellcode** wird hier veröffentlicht - nur Release-Artefakte.

---

## 📦 Struktur

```
cv-manager-pro-releases/
├── version.json              # Hauptapp Version Info
├── launcher-version.json     # Launcher Version Info
├── releases/
│   ├── v1.1.7/
│   │   ├── cv-manager-pro.exe
│   │   ├── cv-manager-launcher.exe
│   │   └── checksums.txt
│   └── v1.0.0/
│       └── ...
├── changelog.md
└── README.md                 # Diese Datei
```

---

## 🔄 Update-Mechanismus

Der **CV Manager Pro Launcher** prüft automatisch:
1. **Launcher-Updates** via `launcher-version.json`
2. **Hauptapp-Updates** via `version.json`

### version.json Format
```json
{
  "latest_version": "1.1.7",
  "release_date": "2025-12-30",
  "download_url": "https://github.com/nash87/cv-manager-pro-releases/releases/download/v1.1.7/cv-manager-pro.exe",
  "changelog_url": "https://github.com/nash87/cv-manager-pro-releases/releases/tag/v1.1.7",
  "release_notes": "Bug fixes and improvements",
  "sha256": "abc123...",
  "size_mb": 45,
  "is_required": false
}
```

---

## 🚀 Releases

### v1.1.7 (2025-12-30) - Latest
**Hauptanwendung**
- ✅ IsFavorite Feature vervollständigt
- ✅ Robustes Error Handling (kein "undefined" mehr!)
- ✅ UnoCSS Design System
- ✅ Phosphor Icons Integration
- ✅ Erweiterte i18n (DE/EN)
- ✅ Bulk-Operations (Delete)

**Download:** [cv-manager-pro.exe](https://github.com/nash87/cv-manager-pro-releases/releases/download/v1.1.7/cv-manager-pro.exe) (45 MB)

---

### v1.0.0 (2025-12-30)
**Launcher (Neu!)**
- 🚀 Automatisches Update-System
- 📍 Data Location Selector
- 🔄 Dual Update Check (Launcher + App)
- 🎨 Stylisches UI im App-Design
- ⚡ Portable - alles in einem Ordner

**Download:** [cv-manager-launcher.exe](https://github.com/nash87/cv-manager-pro-releases/releases/download/v1.0.0/cv-manager-launcher.exe) (8 MB)

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
