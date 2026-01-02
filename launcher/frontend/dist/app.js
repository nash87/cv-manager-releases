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
let onboardingStep = 1;
let selectedTheme = { template: 'classic', color: 'blue' };
let previousView = null;

// ==================== Init ====================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Launcher] Starting...');
    setText('githubStatus', 'Initialisiere...');

    try {
        // Load launcher info
        console.log('[Launcher] Getting launcher info...');
        launcherInfo = await window.go.main.Launcher.GetLauncherInfo();
        console.log('[Launcher] Info:', JSON.stringify(launcherInfo));

        // Update UI with version info
        setText('launcherVersion', `v${launcherInfo.version}`);

        // Check data location
        if (!launcherInfo.data_location) {
            console.log('[Launcher] No data location - show setup');
            setText('githubStatus', 'Setup erforderlich');
            showView('viewDataLocation');

            const exePath = await getExePath();
            setText('defaultPath', exePath + '/cv-data/');
        } else {
            console.log('[Launcher] Data location:', launcherInfo.data_location);
            await startUpdateCheck();
        }
    } catch (error) {
        console.error('[Launcher] Init error:', error);
        setText('githubStatus', 'Init-Fehler');
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
    setText('githubStatus', 'Verbinde...');

    setItemStatus('statusLauncher', 'checking', 'prüfe...');
    setItemStatus('statusApp', '', 'warte...');

    let handled = false;

    try {
        animateProgress(0, 25, 800);

        // Timeout after 12s
        const timeout = setTimeout(() => {
            if (!handled) {
                handled = true;
                console.log('[Launcher] Timeout reached - going offline');
                setText('statusText', 'Netzwerk-Timeout');
                setText('githubStatus', 'Offline');
                setItemStatus('statusLauncher', 'error', 'timeout');
                setItemStatus('statusApp', 'error', 'timeout');
                animateProgress(25, 100, 400);
                setTimeout(() => showReady('Offline-Modus'), 500);
            }
        }, 12000);

        // Check updates
        console.log('[Launcher] Calling CheckForUpdates...');
        setText('statusText', 'Prüfe Versionen...');
        const updates = await window.go.main.Launcher.CheckForUpdates();

        clearTimeout(timeout);
        if (handled) return;
        handled = true;

        console.log('[Launcher] Updates response:', JSON.stringify(updates, null, 2));
        updateStatus = updates;

        // Update status indicators
        const launcherOk = updates.launcher && !updates.launcher.error;
        const appOk = updates.app && !updates.app.error;

        console.log('[Launcher] Status - Launcher OK:', launcherOk, ', App OK:', appOk);

        if (launcherOk) {
            setItemStatus('statusLauncher', 'success', updates.launcher.latest_version);
        } else {
            setItemStatus('statusLauncher', 'error', updates.launcher?.error || 'fehler');
        }

        setText('statusText', 'Prüfe App...');
        setItemStatus('statusApp', 'checking', 'prüfe...');

        await sleep(200);

        if (appOk) {
            setItemStatus('statusApp', 'success', updates.app.latest_version);
            setText('appVersion', `v${updates.app.current_version}`);
        } else {
            setItemStatus('statusApp', 'error', updates.app?.error || 'fehler');
        }

        // Update GitHub status
        const connected = launcherOk || appOk;
        setText('githubStatus', connected ? 'Verbunden' : 'Offline');

        animateProgress(25, 100, 400);
        await sleep(500);

        // Check for available updates
        const hasUpdates =
            (updates.launcher?.update_available) ||
            (updates.app?.update_available);

        console.log('[Launcher] Updates available:', hasUpdates);

        if (hasUpdates) {
            showUpdatesAvailable(updates);
        } else {
            showReady('Alles aktuell');
        }

    } catch (error) {
        if (handled) return;
        handled = true;

        console.error('[Launcher] Check failed:', error);
        setText('githubStatus', 'Fehler');
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
            await window.go.main.Launcher.ApplyUpdateWithVersion(component, info.latest_version);
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

async function showReady(message = 'Bereit') {
    // Check if onboarding is needed first (skip if message indicates setup just completed)
    if (!message.includes('abgeschlossen') && !message.includes('Starten')) {
        const needsOnboarding = await checkAndShowOnboarding();
        if (needsOnboarding) return;
    }

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

// ==================== Onboarding ====================

function showOnboarding() {
    console.log('[Launcher] Showing onboarding');
    onboardingStep = 1;
    updateOnboardingUI();
    showView('viewOnboarding');
    setupThemeSelection();
}

function setupThemeSelection() {
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedTheme = {
                template: card.dataset.template,
                color: card.dataset.color
            };
            console.log('[Launcher] Theme selected:', selectedTheme);
        });
    });
}

function updateOnboardingUI() {
    // Update progress dots
    document.querySelectorAll('.progress-dot').forEach(dot => {
        const step = parseInt(dot.dataset.step);
        dot.classList.toggle('active', step <= onboardingStep);
        dot.classList.toggle('current', step === onboardingStep);
    });

    // Show current step
    for (let i = 1; i <= 3; i++) {
        const stepEl = document.getElementById(`onboardingStep${i}`);
        if (stepEl) {
            stepEl.classList.toggle('active', i === onboardingStep);
        }
    }
}

function nextOnboardingStep() {
    if (onboardingStep < 3) {
        onboardingStep++;
        updateOnboardingUI();
    }
}

function prevOnboardingStep() {
    if (onboardingStep > 1) {
        onboardingStep--;
        updateOnboardingUI();
    }
}

async function skipOnboarding() {
    console.log('[Launcher] Skipping onboarding');
    try {
        await window.go.main.Launcher.MarkOnboardingCompleted();
    } catch (e) {
        console.log('[Launcher] Mark onboarding skipped:', e);
    }
    showReady('Bereit zum Starten');
}

async function completeOnboarding() {
    console.log('[Launcher] Completing onboarding');

    // Collect form data
    const firstName = document.getElementById('onb-firstName')?.value || '';
    const lastName = document.getElementById('onb-lastName')?.value || '';
    const email = document.getElementById('onb-email')?.value || '';
    const jobTitle = document.getElementById('onb-jobTitle')?.value || '';

    const onboardingData = {
        firstName,
        lastName,
        email,
        jobTitle,
        template: selectedTheme.template,
        colorScheme: selectedTheme.color
    };

    console.log('[Launcher] Onboarding data:', onboardingData);

    try {
        await window.go.main.Launcher.SaveOnboardingData(onboardingData);
        await window.go.main.Launcher.MarkOnboardingCompleted();
    } catch (e) {
        console.log('[Launcher] Save onboarding failed:', e);
    }

    showReady('Setup abgeschlossen!');
}

// ==================== Config View ====================

async function showConfigView() {
    console.log('[Launcher] Showing config view');
    previousView = currentView;

    try {
        const config = await window.go.main.Launcher.GetFullConfig();
        console.log('[Launcher] Config:', config);

        setText('configDataPath', config.data_location || 'Nicht konfiguriert');
        setText('configLauncherVer', config.launcher_version || '--');
        setText('configAppVer', config.app_version || '--');
        setText('configOnboardingStatus', config.onboarding_completed ? 'Abgeschlossen' : 'Ausstehend');
    } catch (e) {
        console.log('[Launcher] Failed to get config:', e);
        setText('configDataPath', 'Fehler');
    }

    showView('viewConfigInfo');
}

function closeConfigView() {
    if (previousView) {
        showView(previousView);
    } else {
        showReady('');
    }
}

async function resetAllConfig() {
    if (!confirm('Bist du sicher? Alle Einstellungen werden zurückgesetzt.')) {
        return;
    }

    console.log('[Launcher] Resetting config');

    try {
        await window.go.main.Launcher.ResetConfig();
        console.log('[Launcher] Config reset successful');
        showView('viewDataLocation');

        const exePath = await getExePath();
        setText('defaultPath', exePath + '/cv-data/');
    } catch (e) {
        console.error('[Launcher] Reset failed:', e);
        showError('Reset fehlgeschlagen: ' + getErrorMessage(e));
    }
}

// ==================== Modified startUpdateCheck ====================

async function checkAndShowOnboarding() {
    try {
        const config = await window.go.main.Launcher.GetFullConfig();
        if (!config.onboarding_completed) {
            console.log('[Launcher] Onboarding not completed, showing wizard');
            showOnboarding();
            return true;
        }
    } catch (e) {
        console.log('[Launcher] Could not check onboarding status:', e);
    }
    return false;
}

// Global exports
window.useDefaultLocation = useDefaultLocation;
window.selectCustomLocation = selectCustomLocation;
window.downloadAllUpdates = downloadAllUpdates;
window.skipUpdates = skipUpdates;
window.launchApp = launchApp;
window.retryOperation = retryOperation;
window.nextOnboardingStep = nextOnboardingStep;
window.prevOnboardingStep = prevOnboardingStep;
window.skipOnboarding = skipOnboarding;
window.completeOnboarding = completeOnboarding;
window.showConfigView = showConfigView;
window.closeConfigView = closeConfigView;
window.resetAllConfig = resetAllConfig;

console.log('[Launcher] Ready');
