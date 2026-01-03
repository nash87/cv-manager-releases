# Integration Guide - Sprint 1 Features

Diese Anleitung zeigt, wie du die neuen Features aus Sprint 1 in die bestehende App integrierst.

---

## 🔧 Schritt 1: Backend Build

### 1.1 Go Modules aktualisieren
```bash
cd /c/temp/cv-manager-go
go mod tidy
```

### 1.2 Testen
```bash
go run .
```

### 1.3 Build
```bash
wails build
```

**Ergebnis:** `build/bin/cv-manager-pro.exe` enthält nun die neuen Backend-Features (IsFavorite).

---

## 🎨 Schritt 2: Frontend Integration

### 2.1 index.html erweitern

Öffne [frontend/dist/index.html](c:/temp/cv-manager-go/frontend/dist/index.html) und füge hinzu:

**Nach `<meta name="viewport" ...>` (Zeile ~5):**
```html
<!-- UnoCSS Runtime -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@unocss/reset/tailwind.min.css">
<script src="https://cdn.jsdelivr.net/npm/@unocss/runtime"></script>

<!-- Utility Functions -->
<script src="utils.js"></script>
```

**Direkt nach `<body>` (Zeile ~10):**
```html
<!-- Phosphor Icons Sprite -->
<div style="display: none;" id="icon-sprite">
  <!-- Kopiere den gesamten Inhalt von phosphor-icons.html hier hinein -->
</div>
```

**Alternative:** Lade phosphor-icons.html dynamisch:
```html
<script>
  // Load Phosphor Icons Sprite
  fetch('phosphor-icons.html')
    .then(res => res.text())
    .then(html => {
      const div = document.createElement('div');
      div.style.display = 'none';
      div.innerHTML = html;
      document.body.insertBefore(div, document.body.firstChild);
    });
</script>
```

---

### 2.2 UnoCSS Config aktivieren

Erstelle `frontend/dist/uno.runtime.js`:
```html
<script type="module">
  import config from './uno.config.js';

  // Initialize UnoCSS Runtime
  if (window.__unocss) {
    window.__unocss.config = config;
  }
</script>
```

**Oder:** Verwende UnoCSS Build-Tool (empfohlen für Produktion):
```bash
npm install -D unocss
npx unocss "frontend/dist/**/*.html" -o frontend/dist/uno.css
```

Dann in index.html:
```html
<link rel="stylesheet" href="uno.css">
```

---

## 🐛 Schritt 3: Error Handling Fixes

### 3.1 Alle `showError()` Aufrufe ersetzen

**Suche in app.js nach:**
```javascript
await showError('Fehler beim Erstellen: ' + error.message);
```

**Ersetze durch:**
```javascript
await window.utils.showError(error, 'beim Erstellen');
```

**Schneller Fix mit sed:**
```bash
cd /c/temp/cv-manager-go/frontend/dist

# Backup erstellen
cp app.js app.js.backup

# Automatisch ersetzen (Git Bash)
sed -i 's/showError(\(.*\) + error\.message)/window.utils.showError(error, \1)/g' app.js
```

### 3.2 Manuelle Fixes (wichtigste Stellen)

**1. createFirstCVWithTheme() - Zeile ~1426**
```javascript
// Vorher:
await showError('Fehler beim Erstellen: ' + error.message);

// Nachher:
await window.utils.showError(error, 'beim Erstellen');
```

**2. createNewCV() - Zeile ~1117**
```javascript
// Nachher:
catch (error) {
    console.error('Failed to create CV:', error);
    await window.utils.showError(error, 'beim Erstellen des Lebenslaufs');
}
```

**3. quickCreateCV() - Zeile ~2013**
```javascript
// Nachher:
catch (error) {
    console.error('[Quick Create] Failed:', error);
    await window.utils.showError(error, 'beim schnellen Erstellen');
}
```

---

## ⭐ Schritt 4: Favoriten-Feature UI

### 4.1 Dashboard-Card um Favoriten-Button erweitern

**In `createCVCard()` Funktion (Zeile ~408):**
```javascript
function createCVCard(cv) {
    const statusClass = cv.status ? cv.status.toLowerCase() : 'draft';
    const statusText = window.i18n?.t(`dashboard.filters.${cv.status || 'draft'}`) || cv.status || 'Draft';

    // Favoriten-Status
    const favoriteClass = cv.is_favorite ? 'favorite' : '';
    const favoriteIcon = cv.is_favorite ? 'ph-star-fill' : 'ph-star';

    return `
        <div class="cv-card ${favoriteClass}" data-cv-id="${cv.id}">
            <!-- Favoriten-Button -->
            <button class="favorite-btn" onclick="toggleFavorite('${cv.id}', event)" title="Favorit">
                <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
                    <use xlink:href="#${favoriteIcon}"></use>
                </svg>
            </button>

            <!-- Rest der Card... -->
            <div class="cv-card-header">
                <h3>${cv.name || 'Untitled CV'}</h3>
                <span class="status-badge status-${statusClass}">${statusText}</span>
            </div>

            <!-- ... weitere Inhalte ... -->
        </div>
    `;
}
```

### 4.2 toggleFavorite() Funktion implementieren

**Am Ende von app.js hinzufügen:**
```javascript
/**
 * Toggle Favorite Status of CV
 */
async function toggleFavorite(cvId, event) {
    // Prevent card click event
    if (event) {
        event.stopPropagation();
    }

    try {
        await window.go.main.App.ToggleFavorite(cvId);

        // Update UI
        const card = document.querySelector(`[data-cv-id="${cvId}"]`);
        if (card) {
            card.classList.toggle('favorite');

            const icon = card.querySelector('.favorite-btn use');
            if (icon) {
                const isFavorite = card.classList.contains('favorite');
                icon.setAttribute('xlink:href', isFavorite ? '#ph-star-fill' : '#ph-star');
            }
        }

        // Show notification
        await window.utils.showSuccess(
            window.i18n?.t('favorites.markedAsFavorite') || 'Favorit gesetzt'
        );

    } catch (error) {
        console.error('Failed to toggle favorite:', error);
        await window.utils.showError(error, 'beim Setzen des Favoriten');
    }
}

// Make globally available
window.toggleFavorite = toggleFavorite;
```

### 4.3 CSS für Favoriten-Button

**In style.css am Ende hinzufügen:**
```css
/* Favorite Button */
.cv-card {
    position: relative;
}

.favorite-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.2s ease;
    z-index: 10;
    padding: 4px;
    border-radius: 4px;
}

.favorite-btn:hover {
    background: var(--hover-bg);
    color: var(--primary);
    transform: scale(1.1);
}

.cv-card.favorite .favorite-btn {
    color: #fbbf24; /* Gold color for filled star */
}

.cv-card.favorite .favorite-btn:hover {
    color: #f59e0b; /* Darker gold on hover */
}

/* Optional: Highlight favorite cards */
.cv-card.favorite {
    border-color: #fbbf24;
    box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.2);
}
```

---

## 🔍 Schritt 5: Filter für Favoriten

### 5.1 Filter-UI erweitern

**In Dashboard-View hinzufügen:**
```html
<!-- Nach den bestehenden Filtern -->
<div class="filters">
    <!-- Existing filters... -->

    <!-- New: Favorites Filter -->
    <button id="favoritesFilterBtn" class="filter-btn" onclick="filterFavorites()">
        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
            <use xlink:href="#ph-star"></use>
        </svg>
        <span data-i18n="favorites.showOnlyFavorites">Nur Favoriten</span>
    </button>
</div>
```

### 5.2 Filter-Funktion implementieren

```javascript
let showOnlyFavorites = false;

async function filterFavorites() {
    showOnlyFavorites = !showOnlyFavorites;

    const btn = document.getElementById('favoritesFilterBtn');
    if (btn) {
        btn.classList.toggle('active', showOnlyFavorites);
    }

    await loadDashboard();
}

// In loadDashboard() Funktion einfügen:
async function loadDashboard() {
    try {
        let cvs;

        if (showOnlyFavorites) {
            cvs = await window.go.main.App.GetFavoriteCVs();
        } else {
            cvs = await window.go.main.App.GetAllCVs();
        }

        // ... rest of the function
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        await window.utils.showError(error, 'beim Laden des Dashboards');
    }
}
```

---

## 📝 Schritt 6: i18n Erweitern

### 6.1 de.json erweitern

**Öffne [frontend/dist/i18n/de.json](c:/temp/cv-manager-go/frontend/dist/i18n/de.json) und füge am Ende hinzu:**

```json
{
  "... existing translations ...",

  "favorites": {
    "title": "Favoriten",
    "addToFavorites": "Zu Favoriten hinzufügen",
    "removeFromFavorites": "Aus Favoriten entfernen",
    "showOnlyFavorites": "Nur Favoriten anzeigen",
    "noFavorites": "Noch keine Favoriten",
    "markedAsFavorite": "Als Favorit markiert",
    "unmarkedAsFavorite": "Favorit entfernt"
  },

  "errors": {
    "undefined": "Ein unbekannter Fehler ist aufgetreten",
    "network": "Netzwerkfehler. Bitte versuchen Sie es erneut.",
    "saveFailed": "Speichern fehlgeschlagen",
    "loadFailed": "Laden fehlgeschlagen"
  }
}
```

### 6.2 en.json erweitern

**Analog für Englisch:**
```json
{
  "favorites": {
    "title": "Favorites",
    "addToFavorites": "Add to Favorites",
    "removeFromFavorites": "Remove from Favorites",
    "showOnlyFavorites": "Show Only Favorites",
    "noFavorites": "No Favorites Yet",
    "markedAsFavorite": "Marked as Favorite",
    "unmarkedAsFavorite": "Removed from Favorites"
  },

  "errors": {
    "undefined": "An unknown error occurred",
    "network": "Network error. Please try again.",
    "saveFailed": "Save failed",
    "loadFailed": "Load failed"
  }
}
```

---

## 🧪 Schritt 7: Testing

### 7.1 Backend Tests
```bash
cd /c/temp/cv-manager-go

# Test compilation
go build -o test.exe .

# Run
./test.exe
```

**Teste:**
1. ✅ App startet ohne Fehler
2. ✅ CV erstellen funktioniert
3. ✅ Favorit setzen funktioniert
4. ✅ Favoriten-Filter funktioniert

### 7.2 Frontend Tests

**Öffne Browser DevTools (F12) und teste:**
```javascript
// 1. Utils loaded?
console.log(window.utils);

// 2. Create CV
const cv = await window.go.main.App.CreateCV();
console.log('Created CV:', cv);

// 3. Toggle Favorite
await window.go.main.App.ToggleFavorite(cv.id);

// 4. Get Favorites
const favs = await window.go.main.App.GetFavoriteCVs();
console.log('Favorites:', favs);

// 5. Test error handling
try {
    throw new Error('Test Error');
} catch (e) {
    await window.utils.showError(e, 'beim Testen');
}
```

---

## 🚀 Schritt 8: Build & Deploy

### 8.1 Final Build
```bash
cd /c/temp/cv-manager-go

# Clean build
rm -rf build/bin

# Build for Windows
wails build

# Optional: Build für andere Plattformen
wails build -platform darwin/amd64    # macOS Intel
wails build -platform darwin/arm64    # macOS M1/M2
wails build -platform linux/amd64     # Linux
```

### 8.2 Testen der .exe
```bash
cd build/bin
./cv-manager-pro.exe
```

**Checklist:**
- [ ] App startet
- [ ] Dashboard lädt
- [ ] Icons werden angezeigt
- [ ] Favoriten-Button funktioniert
- [ ] Error Messages sind lesbar
- [ ] i18n funktioniert (DE/EN Switch)
- [ ] Theme Toggle funktioniert

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Backend build
cd /c/temp/cv-manager-go
wails build

# 2. Frontend Integration (manual)
# - Kopiere phosphor-icons.html Content in index.html
# - Füge utils.js Script-Tag hinzu
# - Ersetze showError() Calls mit window.utils.showError()

# 3. Test
./build/bin/cv-manager-pro.exe

# 4. Done! 🎉
```

---

## 💡 Tipps & Tricks

### UnoCSS im Development Mode
```bash
# Watch mode für schnelle Entwicklung
npx unocss "frontend/dist/**/*.html" -o frontend/dist/uno.css --watch
```

### Icons hinzufügen
Neue Icons aus [Phosphor Icons](https://phosphoricons.com/) zu `phosphor-icons.html` hinzufügen:
```html
<symbol id="ph-new-icon" viewBox="0 0 256 256">
  <path d="... SVG path ..."/>
</symbol>
```

### Debugging Error Handling
```javascript
// Aktiviere verbose error logging
window.utils.debugMode = true;
```

---

## ❓ Troubleshooting

### Problem: Icons werden nicht angezeigt
**Lösung:** Überprüfe, ob `phosphor-icons.html` korrekt eingebunden ist:
```javascript
console.log(document.getElementById('ph-star')); // Sollte SVG Symbol sein
```

### Problem: utils.js nicht gefunden
**Lösung:** Stelle sicher, dass `utils.js` im gleichen Ordner wie `index.html` liegt:
```html
<script src="utils.js"></script>  <!-- Relative path -->
```

### Problem: UnoCSS Klassen funktionieren nicht
**Lösung:**
1. Überprüfe CDN Link
2. Oder verwende Build-Prozess mit `npx unocss`

### Problem: Favoriten werden nicht gespeichert
**Lösung:** Backend neu kompilieren:
```bash
wails build
```

---

## 📚 Weitere Ressourcen

- **UnoCSS Docs:** https://unocss.dev/
- **Phosphor Icons:** https://phosphoricons.com/
- **Wails Docs:** https://wails.io/docs/introduction

---

**Happy Coding! 🚀**

Bei Fragen, siehe [SPRINT_1_SUMMARY.md](c:/temp/cv-manager-go/SPRINT_1_SUMMARY.md).
