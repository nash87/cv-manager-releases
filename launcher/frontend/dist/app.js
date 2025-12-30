/**
 * CV Manager Pro - Launcher Frontend
 * Handles UI updates, update checks, downloads, and app launching
 */

// ==================== State Management ====================

let currentView = 'viewUpdateCheck';
let launcherInfo = null;
let updateStatus = {};
let pendingUpdates = [];
let isDownloading = false;

// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Launcher] Initializing...');

    // Load launcher info
    try {
        launcherInfo = await window.go.main.Launcher.GetLauncherInfo();
        console.log('[Launcher] Info loaded:', launcherInfo);

        // Update footer version
        document.getElementById('footerVersion').textContent = `Launcher v${launcherInfo.version}`;
        document.getElementById('launcherVersion').textContent = `v${launcherInfo.version}`;

        // Check if data location is configured
        if (!launcherInfo.data_location || launcherInfo.data_location === '') {
            // First time setup - show data location selector
            console.log('[Launcher] No data location configured, showing setup');
            showView('viewDataLocation');

            // Update default path preview
            const exePath = await getExePath();
            document.getElementById('defaultPath').textContent = exePath + '/cv-data/';
        } else {
            // Data location already configured - proceed to update check
            console.log('[Launcher] Data location configured:', launcherInfo.data_location');
            await startUpdateCheck();
        }
    } catch (error) {
        console.error('[Launcher] Initialization error:', error);
        showError('Fehler beim Initialisieren: ' + getErrorMessage(error));
    }
});

// ==================== View Management ====================

function showView(viewId) {
    console.log('[Launcher] Showing view:', viewId);

    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.style.display = 'none');

    // Show target view
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.style.display = 'block';
        currentView = viewId;
    }
}

// ==================== Data Location Setup ====================

async function useDefaultLocation() {
    console.log('[Launcher] Using default data location');

    try {
        await window.go.main.Launcher.UseDefaultDataLocation();
        console.log('[Launcher] Default location set successfully');

        // Proceed to update check
        await startUpdateCheck();
    } catch (error) {
        console.error('[Launcher] Error setting default location:', error);
        showError('Fehler beim Setzen des Speicherorts: ' + getErrorMessage(error));
    }
}

async function selectCustomLocation() {
    console.log('[Launcher] Opening folder picker');

    try {
        const path = await window.go.main.Launcher.SelectDataLocationDialog();

        if (path) {
            console.log('[Launcher] Selected path:', path);
            await window.go.main.Launcher.SetDataLocation(path);
            console.log('[Launcher] Custom location set successfully');

            // Proceed to update check
            await startUpdateCheck();
        }
    } catch (error) {
        console.error('[Launcher] Error selecting location:', error);
        // User probably cancelled - don't show error
    }
}

async function getExePath() {
    // Get executable path from backend or use current directory
    return '.';
}

// ==================== Update Check ====================

async function startUpdateCheck() {
    console.log('[Launcher] Starting update check...');

    showView('viewUpdateCheck');
    setProgress(0);
    document.getElementById('statusText').textContent = 'Prüfe Launcher und Hauptanwendung';

    try {
        // Animate progress
        animateProgress(0, 30, 1000);

        // Check for updates
        const updates = await window.go.main.Launcher.CheckForUpdates();
        console.log('[Launcher] Update check result:', updates);

        updateStatus = updates;

        animateProgress(30, 100, 500);

        // Wait for animation to complete
        await sleep(600);

        // Check if any updates are available
        const hasUpdates = (updates.launcher && updates.launcher.update_available) ||
                          (updates.app && updates.app.update_available);

        if (hasUpdates) {
            console.log('[Launcher] Updates available');
            showUpdatesAvailable(updates);
        } else {
            console.log('[Launcher] No updates available');
            showReady();
        }
    } catch (error) {
        console.error('[Launcher] Update check failed:', error);
        showError('Fehler beim Prüfen von Updates: ' + getErrorMessage(error));
    }
}

function showUpdatesAvailable(updates) {
    console.log('[Launcher] Showing updates view');

    pendingUpdates = [];
    const container = document.getElementById('updateCards');
    container.innerHTML = '';

    // Add launcher update card
    if (updates.launcher && updates.launcher.update_available) {
        pendingUpdates.push('launcher');
        const card = createUpdateCard(updates.launcher);
        container.appendChild(card);
    }

    // Add app update card
    if (updates.app && updates.app.update_available) {
        pendingUpdates.push('app');
        const card = createUpdateCard(updates.app);
        container.appendChild(card);
    }

    showView('viewUpdatesAvailable');
}

function createUpdateCard(update) {
    const card = document.createElement('div');
    card.className = 'update-card';

    const componentName = update.component === 'launcher' ? 'Launcher' : 'Hauptanwendung';
    const badgeClass = update.is_required ? 'required' : '';
    const badgeText = update.is_required ? 'Erforderlich' : 'Verfügbar';

    card.innerHTML = `
        <div class="update-card-header">
            <div class="update-card-title">${componentName}</div>
            <div class="update-badge ${badgeClass}">${badgeText}</div>
        </div>
        <div class="update-card-body">
            <div class="update-version">
                <span style="color: var(--text-muted);">${update.current_version}</span>
                <span style="color: var(--text-secondary);">→</span>
                <span style="color: var(--primary-400); font-weight: 600;">${update.latest_version}</span>
                <span class="update-size">(${update.size_mb} MB)</span>
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                ${update.release_notes || 'Neue Version verfügbar'}
            </div>
        </div>
    `;

    return card;
}

// ==================== Download & Install ====================

async function downloadAllUpdates() {
    console.log('[Launcher] Starting download for:', pendingUpdates);

    if (pendingUpdates.length === 0) {
        await skipUpdates();
        return;
    }

    isDownloading = true;
    showView('viewDownloading');

    try {
        for (const component of pendingUpdates) {
            const updateInfo = updateStatus[component];

            console.log(`[Launcher] Downloading ${component}...`);
            document.getElementById('downloadTitle').textContent = `Lade ${component === 'launcher' ? 'Launcher' : 'Hauptanwendung'} herunter...`;
            document.getElementById('downloadStatus').textContent = `${updateInfo.latest_version} (${updateInfo.size_mb} MB)`;

            // Download update
            const progress = await window.go.main.Launcher.DownloadUpdate(
                component,
                updateInfo.download_url,
                updateInfo.sha256 || ''
            );

            console.log(`[Launcher] Download result:`, progress);

            if (progress.error) {
                throw new Error(progress.error);
            }

            // Update progress
            setDownloadProgress(100, progress.bytes_downloaded, progress.total_bytes);

            // Install update
            console.log(`[Launcher] Installing ${component}...`);
            document.getElementById('downloadStatus').textContent = 'Installiere Update...';

            await window.go.main.Launcher.ApplyUpdate(component);

            console.log(`[Launcher] ${component} updated successfully`);
        }

        // All updates installed successfully
        isDownloading = false;
        showReady('Alle Updates wurden erfolgreich installiert!');

    } catch (error) {
        isDownloading = false;
        console.error('[Launcher] Download/Install failed:', error);
        showError('Fehler beim Installieren der Updates: ' + getErrorMessage(error));
    }
}

async function skipUpdates() {
    console.log('[Launcher] Skipping updates');
    showReady('Updates können später installiert werden');
}

// ==================== Launch App ====================

async function launchApp() {
    console.log('[Launcher] Launching main application...');

    try {
        await window.go.main.Launcher.LaunchMainApp();
        console.log('[Launcher] Main app launched successfully');

        // Wait a bit and close launcher
        await sleep(1000);
        window.close();

    } catch (error) {
        console.error('[Launcher] Failed to launch app:', error);
        showError('Fehler beim Starten der Anwendung: ' + getErrorMessage(error));
    }
}

// ==================== Ready View ====================

function showReady(message = 'Bereit zum Starten!') {
    console.log('[Launcher] Showing ready view');

    document.getElementById('readyMessage').textContent = message;

    // Update app version if available
    if (updateStatus.app) {
        const appVersion = updateStatus.app.latest_version || updateStatus.app.current_version;
        document.getElementById('appVersion').textContent = `v${appVersion}`;
    }

    showView('viewReady');
}

// ==================== Error Handling ====================

function showError(message) {
    console.error('[Launcher] Error:', message);

    document.getElementById('errorMessage').textContent = message;
    showView('viewError');
}

function retryOperation() {
    console.log('[Launcher] Retrying operation');

    if (currentView === 'viewError') {
        // Retry update check
        startUpdateCheck();
    }
}

function getErrorMessage(error) {
    if (!error) return 'Ein unbekannter Fehler ist aufgetreten';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error) return error.error;

    try {
        return error.toString();
    } catch (e) {
        return 'Ein unbekannter Fehler ist aufgetreten';
    }
}

// ==================== UI Helpers ====================

function setProgress(percent) {
    const fill = document.getElementById('progressFill');
    if (fill) {
        fill.style.width = `${percent}%`;
    }
}

function animateProgress(from, to, duration) {
    const start = Date.now();
    const diff = to - from;

    const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const current = from + (diff * progress);

        setProgress(current);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
}

function setDownloadProgress(percent, downloaded, total) {
    const fill = document.getElementById('downloadProgressFill');
    const percentEl = document.getElementById('downloadPercent');
    const bytesEl = document.getElementById('downloadBytes');

    if (fill) fill.style.width = `${percent}%`;
    if (percentEl) percentEl.textContent = `${Math.round(percent)}%`;
    if (bytesEl) {
        const downloadedMB = (downloaded / 1024 / 1024).toFixed(1);
        const totalMB = (total / 1024 / 1024).toFixed(1);
        bytesEl.textContent = `${downloadedMB} MB / ${totalMB} MB`;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== Make functions globally available ====================

window.useDefaultLocation = useDefaultLocation;
window.selectCustomLocation = selectCustomLocation;
window.downloadAllUpdates = downloadAllUpdates;
window.skipUpdates = skipUpdates;
window.launchApp = launchApp;
window.retryOperation = retryOperation;

console.log('[Launcher] Frontend initialized');
