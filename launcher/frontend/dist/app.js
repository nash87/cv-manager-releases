/**
 * CV Manager Pro - Launcher
 * Live GitHub release updates
 */

// State
let currentView = 'viewUpdateCheck';
let launcherInfo = null;
let updateStatus = {};
let pendingUpdates = [];
let githubStatus = null;

// ==================== Init ====================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Launcher] Starting...');

    try {
        // Load launcher info
        launcherInfo = await window.go.main.Launcher.GetLauncherInfo();
        console.log('[Launcher] Info:', launcherInfo);

        // Update UI with version info
        setText('launcherVersion', `v${launcherInfo.version}`);
        setText('githubStatus', 'Connecting...');

        // Check data location
        if (!launcherInfo.data_location) {
            console.log('[Launcher] No data location - show setup');
            showView('viewDataLocation');

            const exePath = await getExePath();
            setText('defaultPath', exePath + '/cv-data/');
        } else {
            console.log('[Launcher] Data:', launcherInfo.data_location);
            await startUpdateCheck();
        }
    } catch (error) {
        console.error('[Launcher] Init error:', error);
        showError('Initialisierungsfehler: ' + getErrorMessage(error));
    }
});

// ==================== Views ====================

function showView(viewId) {
    console.log('[Launcher] View:', viewId);

    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');

    const view = document.getElementById(viewId);
    if (view) {
        view.style.display = 'block';
        currentView = viewId;
    }
}

// ==================== Setup ====================

async function useDefaultLocation() {
    try {
        await window.go.main.Launcher.UseDefaultDataLocation();
        await startUpdateCheck();
    } catch (error) {
        showError('Fehler: ' + getErrorMessage(error));
    }
}

async function selectCustomLocation() {
    try {
        const path = await window.go.main.Launcher.SelectDataLocationDialog();
        if (path) {
            await window.go.main.Launcher.SetDataLocation(path);
            await startUpdateCheck();
        }
    } catch (error) {
        // User cancelled
    }
}

async function getExePath() {
    return '.';
}

// ==================== Update Check ====================

async function startUpdateCheck() {
    showView('viewUpdateCheck');
    setProgress(0);
    setText('statusText', 'Verbinde mit GitHub...');
    setText('githubStatus', 'Connecting...');

    setItemStatus('statusLauncher', 'checking', 'prüfe...');
    setItemStatus('statusApp', '', 'warte...');

    let handled = false;

    try {
        animateProgress(0, 25, 800);

        // Timeout after 8s
        const timeout = setTimeout(() => {
            if (!handled) {
                handled = true;
                setText('statusText', 'Netzwerk langsam...');
                setText('githubStatus', 'Offline');
                setItemStatus('statusLauncher', 'error', 'timeout');
                setItemStatus('statusApp', 'error', 'timeout');
                animateProgress(25, 100, 400);
                setTimeout(() => showReady('Offline-Modus'), 500);
            }
        }, 8000);

        // Check updates
        setText('statusText', 'Prüfe Versionen...');
        const updates = await window.go.main.Launcher.CheckForUpdates();

        clearTimeout(timeout);
        if (handled) return;
        handled = true;

        console.log('[Launcher] Updates:', updates);
        updateStatus = updates;

        // Update status indicators
        const launcherOk = updates.launcher && !updates.launcher.error;
        const appOk = updates.app && !updates.app.error;

        setItemStatus('statusLauncher', launcherOk ? 'success' : 'error',
            launcherOk ? updates.launcher.latest_version : 'fehler');

        setText('statusText', 'Prüfe App...');
        setItemStatus('statusApp', 'checking', 'prüfe...');

        await sleep(200);

        setItemStatus('statusApp', appOk ? 'success' : 'error',
            appOk ? updates.app.latest_version : 'fehler');

        // Update app version in status bar
        if (appOk) {
            setText('appVersion', `v${updates.app.current_version}`);
        }

        // Update GitHub status
        setText('githubStatus', launcherOk || appOk ? 'Connected' : 'Offline');

        animateProgress(25, 100, 400);
        await sleep(500);

        // Check for available updates
        const hasUpdates =
            (updates.launcher?.update_available) ||
            (updates.app?.update_available);

        if (hasUpdates) {
            showUpdatesAvailable(updates);
        } else {
            showReady('Alles aktuell');
        }

    } catch (error) {
        if (handled) return;
        handled = true;

        console.error('[Launcher] Check failed:', error);
        setText('githubStatus', 'Error');
        setItemStatus('statusLauncher', 'error', 'fehler');
        setItemStatus('statusApp', 'error', 'fehler');
        showReady('Verbindungsfehler - Offline-Modus');
    }
}

function setItemStatus(itemId, status, text) {
    const item = document.getElementById(itemId);
    if (!item) return;

    item.className = 'status-item ' + status;

    const valueEl = item.querySelector('.status-value');
    if (valueEl) valueEl.textContent = text;
}

// ==================== Updates Available ====================

function showUpdatesAvailable(updates) {
    pendingUpdates = [];
    const container = document.getElementById('updateCards');
    container.innerHTML = '';

    if (updates.launcher?.update_available) {
        pendingUpdates.push('launcher');
        container.appendChild(createUpdateCard(updates.launcher));
    }

    if (updates.app?.update_available) {
        pendingUpdates.push('app');
        container.appendChild(createUpdateCard(updates.app));
    }

    showView('viewUpdatesAvailable');
}

function createUpdateCard(update) {
    const card = document.createElement('div');
    card.className = 'update-card';

    const name = update.component === 'launcher' ? 'Launcher' : 'App';
    const date = formatDate(update.release_date);
    const commit = update.commit_hash ? update.commit_hash.substring(0, 7) : '';

    card.innerHTML = `
        <div class="update-card-info">
            <div class="update-card-title">${name}</div>
            <div class="update-card-version">
                ${update.current_version} → <span class="new">${update.latest_version}</span>
            </div>
        </div>
        <div class="update-card-meta">
            ${date}${commit ? ' • ' + commit : ''}
        </div>
    `;

    return card;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diff === 0) return 'Heute';
        if (diff === 1) return 'Gestern';
        if (diff < 7) return `Vor ${diff}d`;

        return date.toLocaleDateString('de-DE');
    } catch {
        return dateStr;
    }
}

// ==================== Download ====================

async function downloadAllUpdates() {
    if (pendingUpdates.length === 0) {
        await skipUpdates();
        return;
    }

    showView('viewDownloading');

    try {
        for (const component of pendingUpdates) {
            const info = updateStatus[component];

            setText('downloadTitle', `Lade ${component === 'launcher' ? 'Launcher' : 'App'}...`);
            setText('downloadStatus', `${info.latest_version} (${info.size_mb || '?'} MB)`);

            const progress = await window.go.main.Launcher.DownloadUpdate(
                component,
                info.download_url,
                info.sha256 || ''
            );

            if (progress.error) throw new Error(progress.error);

            setDownloadProgress(100, progress.bytes_downloaded, progress.total_bytes);

            setText('downloadStatus', 'Installiere...');
            await window.go.main.Launcher.ApplyUpdate(component);
        }

        showReady('Updates installiert!');

    } catch (error) {
        console.error('[Launcher] Download failed:', error);
        showError('Download fehlgeschlagen: ' + getErrorMessage(error));
    }
}

async function skipUpdates() {
    showReady('Updates übersprungen');
}

// ==================== Launch ====================

async function launchApp() {
    try {
        await window.go.main.Launcher.LaunchMainApp();
        await sleep(800);
        window.close();
    } catch (error) {
        showError('Start fehlgeschlagen: ' + getErrorMessage(error));
    }
}

// ==================== Ready ====================

function showReady(message = 'Bereit') {
    setText('readyMessage', message);

    if (updateStatus.app) {
        const ver = updateStatus.app.latest_version || updateStatus.app.current_version;
        setText('appVersion', `v${ver}`);
    }

    showView('viewReady');
}

// ==================== Error ====================

function showError(message) {
    setText('errorMessage', message);
    showView('viewError');
}

function retryOperation() {
    startUpdateCheck();
}

function getErrorMessage(error) {
    if (!error) return 'Unbekannter Fehler';
    if (typeof error === 'string') return error;
    return error.message || error.error || 'Unbekannter Fehler';
}

// ==================== Helpers ====================

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setProgress(pct) {
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = `${pct}%`;
}

function animateProgress(from, to, duration) {
    const start = Date.now();
    const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        setProgress(from + (to - from) * progress);
        if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
}

function setDownloadProgress(pct, downloaded, total) {
    const fill = document.getElementById('downloadProgressFill');
    if (fill) fill.style.width = `${pct}%`;

    setText('downloadPercent', `${Math.round(pct)}%`);

    const dlMB = (downloaded / 1024 / 1024).toFixed(1);
    const totalMB = (total / 1024 / 1024).toFixed(1);
    setText('downloadBytes', `${dlMB} / ${totalMB} MB`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Global exports
window.useDefaultLocation = useDefaultLocation;
window.selectCustomLocation = selectCustomLocation;
window.downloadAllUpdates = downloadAllUpdates;
window.skipUpdates = skipUpdates;
window.launchApp = launchApp;
window.retryOperation = retryOperation;

console.log('[Launcher] Ready');
