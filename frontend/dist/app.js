// CV Manager Pro - Complete Frontend Application Logic with GDPR
// Encrypted & GDPR Compliant CV Management System

let currentView = 'dashboard';
let currentCV = null;
let allCVs = [];
let currentTheme = 'dark';
let visualEditorLayout = [];
let currentZoom = 100;

// ==================== Splash Screen ====================

function updateSplashStatus(text, progress) {
    const statusText = document.getElementById('loadingStatusText');
    const progressBar = document.getElementById('splashProgress');

    if (statusText) statusText.textContent = text;
    if (progressBar) progressBar.style.width = progress + '%';
}

async function hideSplash() {
    const splash = document.getElementById('splashScreen');
    if (splash) {
        updateSplashStatus('Bereit!', 100);
        await new Promise(resolve => setTimeout(resolve, 300));
        splash.classList.add('fade-out');
        await new Promise(resolve => setTimeout(resolve, 500));
        splash.style.display = 'none';
    }
}

// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('CV Manager Pro - Encrypted & GDPR Compliant - Initializing...');

    try {
        // Step 1: Initialize i18n
        updateSplashStatus('Lade Sprachpakete...', 10);
        await window.i18n.init();
        console.log('i18n initialized with German as default');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Step 2: Initialize theme
        updateSplashStatus('Lade Theme...', 20);
        loadTheme();
        await new Promise(resolve => setTimeout(resolve, 200));

        // Step 3: Check consent
        updateSplashStatus('Prüfe Datenschutz-Einwilligung...', 40);
        await checkConsent();
        await new Promise(resolve => setTimeout(resolve, 200));

        // Step 4: Setup event listeners
        updateSplashStatus('Initialisiere Benutzeroberfläche...', 60);
        setupNavigation();
        setupThemeToggle();
        setupDashboardListeners();
        await new Promise(resolve => setTimeout(resolve, 150));

        updateSplashStatus('Lade Datenschutz-Module...', 70);
        setupPrivacyListeners();
        setupVisualEditorListeners();
        await new Promise(resolve => setTimeout(resolve, 150));

        updateSplashStatus('Initialisiere Einstellungen...', 80);
        setupSettingsListeners();
        setupExitButton();
        setupOnboarding();
        setupKeyboardShortcuts();
        setupAutoSave();
        setupDarkModeToggle();
        await new Promise(resolve => setTimeout(resolve, 150));

        // Step 5: Final initialization
        updateSplashStatus('Finalisiere...', 90);
        await new Promise(resolve => setTimeout(resolve, 200));

        console.log('CV Manager Pro ready!');

        // Hide splash screen
        await hideSplash();

        // Show onboarding if flagged or first run
        if (window.shouldShowOnboarding) {
            await showOnboarding();
        } else {
            // Check backend config for first run
            try {
                const config = await window.go.main.App.GetAppConfig();
                if (config && (config.first_run || !config.onboarding_shown)) {
                    await showOnboarding();
                }
            } catch (err) {
                console.log('Could not check onboarding status:', err);
            }
        }
    } catch (error) {
        console.error('Initialization error:', error);
        updateSplashStatus('Fehler beim Laden!', 0);
        setTimeout(async () => {
            await showCustomAlert('Startfehler', 'Fehler beim Starten der Anwendung: ' + error.message, 'error');
        }, 500);
    }
});

// ==================== Consent Management ====================

async function checkConsent() {
    try {
        const consent = await window.go.main.App.GetConsent();

        if (!consent || !consent.consent_given || consent.consent_withdrawn) {
            // Show consent screen - user MUST accept
            console.log('[Consent] No consent found, showing consent screen');
            showConsentScreen();
            return;
        }

        // Consent already given - proceed to app
        console.log('[Consent] Consent already given, loading app...');
        await ensureDefaultCV();
        await loadDashboard();
    } catch (error) {
        console.error('[Consent] Error checking consent:', error);
        // Show consent screen on error
        showConsentScreen();
    }
}

async function ensureDefaultCV() {
    try {
        console.log('[ensureDefaultCV] Checking if CVs exist...');
        const cvs = await window.go.main.App.GetAllCVs();
        console.log('[ensureDefaultCV] Found CVs:', cvs ? cvs.length : 0);

        if (!cvs || cvs.length === 0) {
            console.log('[ensureDefaultCV] No CVs found. Creating default CV...');
            const defaultCV = await window.go.main.App.CreateCV();
            console.log('[ensureDefaultCV] Empty CV created:', defaultCV);

            // Set default values
            defaultCV.firstname = 'Max';
            defaultCV.lastname = 'Mustermann';
            defaultCV.email = 'max@example.com';
            defaultCV.job_title = 'Berufstitel';
            defaultCV.phone = '+49 123 456789';
            defaultCV.summary = 'Professioneller Lebenslauf erstellt mit CV Manager Pro';
            defaultCV.template = 'modern';
            defaultCV.color_scheme = 'purple';
            defaultCV.status = 'draft';

            console.log('[ensureDefaultCV] Saving default CV...');
            await window.go.main.App.SaveCV(defaultCV);
            console.log('[ensureDefaultCV] Default CV created successfully!');

            // Reload dashboard to show the new CV
            await loadDashboard();
            return true;
        }
        console.log('[ensureDefaultCV] CVs already exist, skipping default creation');
        return false;
    } catch (error) {
        console.error('[ensureDefaultCV] ERROR:', error);
        console.error('[ensureDefaultCV] Error stack:', error.stack);
        return false;
    }
}

function showConsentScreen() {
    document.getElementById('consentScreen').style.display = 'flex';

    // Setup consent button
    document.getElementById('grantConsentBtn').addEventListener('click', async () => {
        try {
            console.log('[Consent] User accepted consent, granting...');
            await window.go.main.App.GrantConsent();
            console.log('[Consent] Consent granted successfully');

            document.getElementById('consentScreen').style.display = 'none';

            // Create default CV AFTER consent is given
            try {
                await ensureDefaultCV();
            } catch (cvError) {
                console.error('[Consent] Error creating default CV:', cvError);
                // Continue even if default CV fails - user can create manually
            }

            // Load dashboard
            await loadDashboard();

            await showSuccess(window.i18n ? window.i18n.t('notifications.consentGranted') : 'Willkommen! Deine Daten sind jetzt sicher verschlüsselt.');

            // Mark that onboarding should be shown after splash
            window.shouldShowOnboarding = true;
        } catch (error) {
            console.error('[Consent] Error granting consent:', error);
            const errorMsg = error?.message || error?.toString() || 'Unbekannter Fehler';
            await showError('Fehler beim Akzeptieren: ' + errorMsg);
        }
    });
}

// ==================== Theme Management ====================

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    currentTheme = savedTheme;
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    currentTheme = theme;
    localStorage.setItem('theme', theme);
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    const toggleTheme = () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    };

    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
}

// ==================== Navigation ====================

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });
}

function switchView(viewName) {
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    const viewId = viewName + 'View';
    const targetView = document.getElementById(viewId);

    if (targetView) {
        targetView.classList.add('active');
        currentView = viewName;

        // Load view-specific data
        if (viewName === 'dashboard') {
            loadDashboard();
        } else if (viewName === 'statistics') {
            loadStatistics();
        } else if (viewName === 'applications') {
            loadApplicationsView();
        } else if (viewName === 'privacy') {
            loadPrivacyView();
        } else if (viewName === 'visualEditor') {
            loadVisualEditor();
        } else if (viewName === 'settings') {
            loadSettings();
        }
    }
}

// ==================== Dashboard ====================

function setupDashboardListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterCVs);
    }

    // Filters
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');

    if (statusFilter) statusFilter.addEventListener('change', filterCVs);
    if (categoryFilter) categoryFilter.addEventListener('change', filterCVs);

    // New CV button (sidebar)
    const newCvBtn = document.getElementById('newCvBtn');
    if (newCvBtn) {
        newCvBtn.addEventListener('click', createNewCV);
    }

    // New CV button (dashboard center - prominent)
    const newCvBtnDashboard = document.getElementById('newCvBtnDashboard');
    if (newCvBtnDashboard) {
        newCvBtnDashboard.addEventListener('click', createNewCV);
    }

    // Editor buttons
    const backBtn = document.getElementById('backBtn');
    const saveBtn = document.getElementById('saveBtn');
    const exportBtn = document.getElementById('exportBtn');

    if (backBtn) backBtn.addEventListener('click', () => switchView('dashboard'));
    if (saveBtn) saveBtn.addEventListener('click', saveCurrentCV);
    if (exportBtn) exportBtn.addEventListener('click', () => {
        if (currentCV) exportCV(currentCV.id);
    });
}

async function loadDashboard() {
    try {
        const result = await window.go.main.App.GetAllCVs();
        allCVs = result || [];
        renderCVCards(allCVs);
    } catch (error) {
        console.error('Failed to load CVs:', error);
        if (error.toString().includes('consent')) {
            showConsentScreen();
        } else {
            showError('Failed to load CVs');
        }
    }
}

function renderCVCards(cvs) {
    const grid = document.getElementById('cvGrid');
    if (!grid) return;

    if (cvs.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3 data-i18n="dashboard.empty.title">${window.i18n?.t('dashboard.empty.title') || 'No CVs Yet'}</h3>
                <p data-i18n="dashboard.empty.description">${window.i18n?.t('dashboard.empty.description') || 'Create your first CV to get started'}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = cvs.map(cv => createCVCard(cv)).join('');

    // Add event listeners to cards
    grid.querySelectorAll('.cv-card').forEach(card => {
        const cvId = card.dataset.cvId;

        card.addEventListener('click', (e) => {
            // Don't open editor if clicking action buttons
            if (!e.target.closest('.cv-card-actions')) {
                openEditor(cvId);
            }
        });
    });

    // Action buttons
    grid.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cvId = btn.closest('.cv-card').dataset.cvId;
            openEditor(cvId);
        });
    });

    grid.querySelectorAll('.btn-export').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cvId = btn.closest('.cv-card').dataset.cvId;
            exportCV(cvId);
        });
    });

    grid.querySelectorAll('.btn-duplicate').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Duplicate functionality not implemented yet
            showInfo('Duplicate feature coming soon');
        });
    });

    grid.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cvId = btn.closest('.cv-card').dataset.cvId;
            deleteCV(cvId);
        });
    });
}

function createCVCard(cv) {
    const statusClass = cv.status ? cv.status.toLowerCase() : 'draft';
    const statusKey = `dashboard.filters.${cv.status || 'draft'}`;
    const statusText = window.i18n?.t(statusKey) || cv.status || 'Draft';

    // Handle tags (can be array or comma-separated string)
    let tagsArray = [];
    if (cv.tags) {
        if (Array.isArray(cv.tags)) {
            tagsArray = cv.tags;
        } else if (typeof cv.tags === 'string') {
            tagsArray = cv.tags.split(',').map(t => t.trim()).filter(t => t);
        }
    }

    return `
        <div class="cv-card" data-cv-id="${cv.id}">
            <div class="cv-card-header">
                <span class="status-badge ${statusClass}">${statusText}</span>
                <span class="cv-template-badge">${cv.template || 'modern'}</span>
            </div>
            <h3 class="cv-card-name">${cv.firstname || ''} ${cv.lastname || ''}</h3>
            <p class="cv-card-job">${cv.job_title || 'Kein Titel'}</p>
            ${cv.target_job ? `<p class="cv-card-target">Ziel: ${cv.target_job}</p>` : ''}
            ${cv.email ? `<p class="cv-card-email">${cv.email}</p>` : ''}

            <div class="cv-card-stats">
                <div class="stat-item" title="Berufserfahrung">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    <span>${cv.work_count || 0} Jobs</span>
                </div>
                <div class="stat-item" title="Bildung">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                    <span>${cv.education_count || 0} Bildung</span>
                </div>
                <div class="stat-item" title="Fähigkeiten">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                    </svg>
                    <span>${cv.skills_count || 0} Skills</span>
                </div>
            </div>

            ${tagsArray.length > 0 ? `
                <div class="cv-card-tags">
                    ${tagsArray.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}

            <div class="cv-card-actions">
                <button class="btn-small btn-edit" onclick="editCV('${cv.id}')" title="Bearbeiten">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Bearbeiten
                </button>
                <button class="btn-small btn-export" onclick="exportCVToPDF('${cv.id}')" title="PDF Export">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    PDF
                </button>
                <button class="btn-small btn-duplicate" onclick="duplicateCV('${cv.id}')" title="Duplizieren">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Kopie
                </button>
                <button class="btn-small btn-delete" onclick="deleteCV('${cv.id}')" title="Löschen">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Löschen
                </button>
            </div>
        </div>
    `;
}

async function filterCVs() {
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const category = document.getElementById('categoryFilter')?.value || '';

    try {
        let filtered = allCVs;

        // Client-side search (works even if backend SearchCVs doesn't exist)
        if (searchQuery) {
            filtered = filtered.filter(cv => {
                const searchText = [
                    cv.firstname || '',
                    cv.lastname || '',
                    cv.email || '',
                    cv.job_title || '',
                    cv.summary || '',
                    cv.target_job || '',
                    cv.target_company || '',
                    cv.tags || ''
                ].join(' ').toLowerCase();

                return searchText.includes(searchQuery);
            });
        }

        // Filter by status
        if (status && status !== 'all') {
            filtered = filtered.filter(cv => cv.status === status);
        }

        // Filter by category
        if (category && category !== 'all') {
            filtered = filtered.filter(cv => cv.category === category);
        }

        renderCVCards(filtered);
    } catch (error) {
        console.error('Filter error:', error);
        renderCVCards(allCVs); // Fallback: show all CVs
    }
}

// ==================== Statistics ====================

async function loadStatistics() {
    try {
        const stats = await window.go.main.App.GetStatistics();
        renderStatistics(stats);
    } catch (error) {
        console.error('Failed to load statistics:', error);
        showError('Failed to load statistics');
    }
}

function renderStatistics(stats) {
    const container = document.getElementById('statsContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-card-title">Total CVs</div>
            <div class="stat-card-value">${stats.total_cvs || 0}</div>
        </div>

        <div class="stat-card">
            <div class="stat-card-title">Total Work Experience</div>
            <div class="stat-card-value">${stats.total_work_experience || 0}</div>
        </div>

        <div class="stat-card">
            <div class="stat-card-title">Total Education</div>
            <div class="stat-card-value">${stats.total_education || 0}</div>
        </div>

        <div class="stat-card">
            <div class="stat-card-title">Total Skills</div>
            <div class="stat-card-value">${stats.total_skills || 0}</div>
        </div>

        <div class="stat-card">
            <div class="stat-card-title">Avg Work Experience</div>
            <div class="stat-card-value">${stats.avg_work_experience ? stats.avg_work_experience.toFixed(1) : '0.0'}</div>
        </div>

        <div class="stat-card">
            <div class="stat-card-title">Avg Skills per CV</div>
            <div class="stat-card-value">${stats.avg_skills ? stats.avg_skills.toFixed(1) : '0.0'}</div>
        </div>
    `;
}

// ==================== Privacy & Security View ====================

function setupPrivacyListeners() {
    const exportAllDataBtn = document.getElementById('exportAllDataBtn');
    const viewComplianceLogBtn = document.getElementById('viewComplianceLogBtn');
    const deleteAllDataBtn = document.getElementById('deleteAllDataBtn');

    if (exportAllDataBtn) {
        exportAllDataBtn.addEventListener('click', exportAllDataGDPR);
    }

    if (viewComplianceLogBtn) {
        viewComplianceLogBtn.addEventListener('click', viewComplianceLog);
    }

    if (deleteAllDataBtn) {
        deleteAllDataBtn.addEventListener('click', deleteAllDataGDPR);
    }

    // Modal close
    const modal = document.getElementById('complianceLogModal');
    if (modal) {
        const closeBtn = modal.querySelector('.btn-close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

async function loadPrivacyView() {
    try {
        const securityInfo = await window.go.main.App.GetSecurityInfo();
        renderSecurityInfo(securityInfo);
    } catch (error) {
        console.error('Failed to load security info:', error);
        showError('Failed to load security information');
    }
}

function renderSecurityInfo(info) {
    // Security details
    const detailsContainer = document.getElementById('securityDetails');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="security-detail-item">
                <strong>Encryption</strong>
                <span>${info.encryption_algorithm}</span>
            </div>
            <div class="security-detail-item">
                <strong>Key Size</strong>
                <span>${info.encryption_key_size} bits</span>
            </div>
            <div class="security-detail-item">
                <strong>Database</strong>
                <span>${info.database_type}</span>
            </div>
            <div class="security-detail-item">
                <strong>Data Location</strong>
                <span>${info.data_location}</span>
            </div>
        `;
    }

    // GDPR Articles
    const articlesContainer = document.getElementById('gdprArticles');
    if (articlesContainer && info.gdpr_articles) {
        articlesContainer.innerHTML = info.gdpr_articles.map(article => `
            <div class="gdpr-article">
                <div class="gdpr-article-header">
                    <div>
                        <h3>${article.article}</h3>
                        <h4>${article.title}</h4>
                    </div>
                    <span class="compliance-badge">${article.compliance}</span>
                </div>
                <p>${article.description}</p>
                <a href="${article.link}" target="_blank">View full article →</a>
            </div>
        `).join('');
    }
}

async function exportAllDataGDPR() {
    const message = window.i18n ? window.i18n.t('confirmations.exportAllData') : 'Dies exportiert alle deine Daten als JSON. Fortfahren?';
    const confirmed = await showCustomConfirm('Daten exportieren?', message, 'info');
    if (!confirmed) {
        return;
    }

    try {
        const filepath = await window.go.main.App.ExportAllDataGDPR();
        await showSuccess(`Alle Daten exportiert nach: ${filepath}`);
    } catch (error) {
        console.error('Export failed:', error);
        await showError('Fehler beim Exportieren: ' + error);
    }
}

async function viewComplianceLog() {
    try {
        const log = await window.go.main.App.GetComplianceLog();
        renderComplianceLog(log);
    } catch (error) {
        console.error('Failed to load compliance log:', error);
        showError('Failed to load compliance log');
    }
}

function renderComplianceLog(log) {
    const modal = document.getElementById('complianceLogModal');
    const content = document.getElementById('complianceLogContent');

    if (!modal || !content) return;

    if (!log || log.length === 0) {
        content.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No compliance log entries yet.</p>';
    } else {
        content.innerHTML = log.reverse().map(entry => `
            <div class="compliance-entry">
                <div class="compliance-entry-header">
                    <span class="compliance-entry-operation">${entry.operation}</span>
                    <span class="compliance-entry-timestamp">${new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <div class="compliance-entry-legal">${entry.legal_basis}</div>
                <div class="compliance-entry-description">${entry.description}</div>
            </div>
        `).join('');
    }

    modal.style.display = 'flex';
}

async function deleteAllDataGDPR() {
    const confirmation = prompt('⚠️ WARNING: This will permanently delete ALL your data.\n\nType "DELETE ALL MY DATA" to confirm:');

    if (confirmation !== 'DELETE ALL MY DATA') {
        showInfo('Deletion cancelled');
        return;
    }

    try {
        await window.go.main.App.DeleteAllDataGDPR();
        showSuccess('All data has been deleted');
        // Reload app
        location.reload();
    } catch (error) {
        console.error('Delete failed:', error);
        showError('Failed to delete data: ' + error);
    }
}

// ==================== Settings ====================

function setupSettingsListeners() {
    const withdrawConsentBtn = document.getElementById('withdrawConsentBtn');

    if (withdrawConsentBtn) {
        withdrawConsentBtn.addEventListener('click', withdrawConsent);
    }
}

async function loadSettings() {
    try {
        const consent = await window.go.main.App.GetConsent();
        renderConsentStatus(consent);
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

function renderConsentStatus(consent) {
    const statusContainer = document.getElementById('consentStatus');
    if (!statusContainer) return;

    const isActive = consent && consent.consent_given && !consent.consent_withdrawn;

    statusContainer.innerHTML = `
        <div class="consent-status">
            <strong>Status:</strong> ${isActive ? 'Active' : 'Withdrawn'}<br>
            <strong>Version:</strong> ${consent?.consent_version || 'N/A'}<br>
            <strong>Granted:</strong> ${consent?.consent_timestamp ? new Date(consent.consent_timestamp).toLocaleString() : 'N/A'}<br>
            ${consent?.consent_withdrawn ? `<strong>Withdrawn:</strong> ${new Date(consent.withdrawal_date).toLocaleString()}` : ''}
        </div>
    `;
}

async function withdrawConsent() {
    const message = window.i18n ? window.i18n.t('confirmations.withdrawConsent') : '⚠️ Warnung: Widerruf der Einwilligung deaktiviert alle Datenoperationen.\n\nDu musst erneut zustimmen um die Anwendung zu nutzen.\n\nFortfahren?';
    const confirmed = await showCustomConfirm('Einwilligung widerrufen?', message, 'warning');
    if (!confirmed) {
        return;
    }

    try {
        await window.go.main.App.WithdrawConsent();
        await showSuccess('Einwilligung widerrufen. Bitte starte die Anwendung neu.');
        // Disable all CV operations
        setTimeout(() => location.reload(), 2000);
    } catch (error) {
        console.error('Failed to withdraw consent:', error);
        await showError('Fehler beim Widerrufen der Einwilligung');
    }
}

// ==================== Visual PDF Editor ====================

function setupVisualEditorListeners() {
    // Empty function - Visual Editor listeners are set up in loadVisualEditor()
    // This is called during app init, but actual setup happens when the view loads
    console.log('Visual Editor listeners will be set up when view loads');
}

// Visual Editor State
let visualEditorCurrentCV = null;
let visualEditorZoom = 100;

async function loadVisualEditor() {
    // Load CV list into dropdown
    await loadVisualEditorCVList();

    // Setup event listeners
    setupVisualEditorEventListeners();
}

async function loadVisualEditorCVList() {
    try {
        const cvList = await window.go.main.App.GetAllCVs();
        const select = document.getElementById('visualEditorCVSelect');
        const loadingEl = document.querySelector('.pdf-loading');

        if (!select) return;

        // Clear and populate
        select.innerHTML = '<option value="">CV auswählen...</option>';

        if (cvList && cvList.length > 0) {
            cvList.forEach(cv => {
                const option = document.createElement('option');
                option.value = cv.id;
                option.textContent = `${cv.firstname} ${cv.lastname} - ${cv.job_title || 'Untitled'}`;
                select.appendChild(option);
            });

            // Hide loading, show default message
            if (loadingEl) {
                loadingEl.innerHTML = `
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <p style="color: var(--text-muted); margin-top: 16px;">Wähle einen Lebenslauf aus, um die PDF-Vorschau zu sehen</p>
                `;
                loadingEl.style.display = 'flex';
            }
        } else {
            // No CVs found - show helpful message
            if (loadingEl) {
                loadingEl.innerHTML = `
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p style="color: var(--text-muted); margin-top: 16px;">Keine Lebensläufe gefunden</p>
                    <p style="color: var(--text-muted); font-size: 12px; margin-top: 8px;">Erstelle zuerst einen Lebenslauf im Dashboard oder Editor</p>
                    <button class="btn-primary" style="margin-top: 24px;" onclick="switchView('dashboard')">Zum Dashboard</button>
                `;
                loadingEl.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Failed to load CV list:', error);
        const loadingEl = document.querySelector('.pdf-loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3" color="var(--error-color)">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <p style="color: var(--error-color); margin-top: 16px;">Fehler beim Laden der Lebensläufe</p>
                <p style="color: var(--text-muted); font-size: 12px; margin-top: 8px;">${error.message}</p>
            `;
            loadingEl.style.display = 'flex';
        }
    }
}

function setupVisualEditorEventListeners() {
    // CV Selection
    const cvSelect = document.getElementById('visualEditorCVSelect');
    if (cvSelect) {
        cvSelect.addEventListener('change', async (e) => {
            if (e.target.value) {
                await loadCVPreview(e.target.value);
            }
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshPreviewBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            if (visualEditorCurrentCV) {
                await loadCVPreview(visualEditorCurrentCV.id);
            }
        });
    }

    // Export button
    const exportBtn = document.getElementById('exportVisualPDFBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            if (visualEditorCurrentCV) {
                await exportCV(visualEditorCurrentCV.id);
            } else {
                await showError('Bitte wähle zuerst einen Lebenslauf aus');
            }
        });
    }

    // Apply changes button
    const applyBtn = document.getElementById('applyChangesBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            if (visualEditorCurrentCV) {
                await applyVisualEditorChanges();
            }
        });
    }

    // Zoom controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            visualEditorZoom = Math.min(200, visualEditorZoom + 10);
            updateZoom();
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            visualEditorZoom = Math.max(50, visualEditorZoom - 10);
            updateZoom();
        });
    }

    // Settings live update
    const templateSelect = document.getElementById('templateSelect');
    const colorSchemeSelect = document.getElementById('colorSchemeSelect');
    const fontSizeRange = document.getElementById('fontSizeRange');
    const spacingRange = document.getElementById('spacingRange');

    if (fontSizeRange) {
        fontSizeRange.addEventListener('input', (e) => {
            document.getElementById('fontSizeValue').textContent = e.target.value + 'pt';
        });
    }

    if (spacingRange) {
        spacingRange.addEventListener('input', (e) => {
            document.getElementById('spacingValue').textContent = e.target.value + 'x';
        });
    }
}

async function loadCVPreview(cvId) {
    try {
        const cv = await window.go.main.App.GetCV(cvId);
        visualEditorCurrentCV = cv;

        // Show loading state
        const loadingEl = document.querySelector('.pdf-loading');
        const iframe = document.getElementById('pdfPreviewFrame');

        if (loadingEl) {
            loadingEl.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                    </path>
                </svg>
                <p>PDF wird generiert...</p>
            `;
            loadingEl.style.display = 'flex';
        }

        if (iframe) {
            iframe.style.display = 'none';
        }

        // Generate PDF (temporary file) - Backend function is ExportPDF not ExportCVToPDF
        console.log('[Visual Editor] Generating PDF for CV:', cvId);
        const pdfPath = await window.go.main.App.ExportPDF(cvId);
        console.log('[Visual Editor] PDF generated at:', pdfPath);

        // Load PDF in iframe
        if (iframe && pdfPath) {
            // Convert Windows path to file URL
            const fileUrl = 'file:///' + pdfPath.replace(/\\/g, '/');
            console.log('[Visual Editor] Loading PDF from:', fileUrl);

            iframe.src = fileUrl;
            iframe.onload = () => {
                console.log('[Visual Editor] PDF loaded successfully');
                if (loadingEl) loadingEl.style.display = 'none';
                iframe.style.display = 'block';
                updateZoom();
            };
            iframe.onerror = (err) => {
                console.error('[Visual Editor] Failed to load PDF in iframe:', err);
                if (loadingEl) {
                    loadingEl.innerHTML = `
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <p style="color: var(--error-color);">Fehler beim Laden der PDF</p>
                        <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">PDF wurde generiert: ${pdfPath}</p>
                        <button class="btn-small" onclick="window.go.main.App.OpenPDFExternally('${pdfPath}')">Extern öffnen</button>
                    `;
                }
            };
        } else {
            throw new Error('Iframe element nicht gefunden oder PDF-Pfad leer');
        }

    } catch (error) {
        console.error('[Visual Editor] Failed to load CV preview:', error);
        const loadingEl = document.querySelector('.pdf-loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <p style="color: var(--error-color);">Fehler beim Laden der PDF-Vorschau</p>
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">${error.message}</p>
            `;
            loadingEl.style.display = 'flex';
        }
    }
}

async function applyVisualEditorChanges() {
    if (!visualEditorCurrentCV) return;

    // Get settings
    const template = document.getElementById('templateSelect')?.value;
    const colorScheme = document.getElementById('colorSchemeSelect')?.value;

    try {
        // Update CV with new settings
        visualEditorCurrentCV.template = template;
        visualEditorCurrentCV.color_scheme = colorScheme;

        await window.go.main.App.SaveCV(visualEditorCurrentCV);
        await showSuccess('Änderungen gespeichert! Vorschau wird aktualisiert...');

        // Reload preview
        await loadCVPreview(visualEditorCurrentCV.id);
    } catch (error) {
        console.error('Failed to apply changes:', error);
        await showError('Fehler beim Anwenden der Änderungen');
    }
}

function updateZoom() {
    const iframe = document.getElementById('pdfPreviewFrame');
    const zoomLevelEl = document.getElementById('zoomLevel');

    if (iframe) {
        iframe.style.transform = `scale(${visualEditorZoom / 100})`;
        iframe.style.transformOrigin = 'top center';
    }

    if (zoomLevelEl) {
        zoomLevelEl.textContent = visualEditorZoom + '%';
    }
}

function getColorForScheme(scheme) {
    const colors = {
        blue: '#2563EB',
        green: '#059669',
        purple: '#8B5CF6',
        red: '#DC2626',
        orange: '#EA580C',
        dark: '#1F2937'
    };
    return colors[scheme] || colors.blue;
}

function updateZoom() {
    const preview = document.querySelector('.preview-page');
    const zoomLevel = document.getElementById('zoomLevel');

    if (preview) {
        preview.style.transform = `scale(${currentZoom / 100})`;
        preview.style.transformOrigin = 'top center';
    }

    if (zoomLevel) {
        zoomLevel.textContent = currentZoom + '%';
    }
}

// ==================== CV Editor ====================

async function createNewCV() {
    try {
        const newCV = await window.go.main.App.CreateCV();
        currentCV = newCV;
        renderEditor(newCV);
        switchView('editor');
    } catch (error) {
        console.error('Failed to create CV:', error);
        if (error.toString().includes('consent')) {
            showError('Consent required to create CV');
            showConsentScreen();
        } else {
            showError('Failed to create CV');
        }
    }
}

async function openEditor(cvId) {
    try {
        const cv = await window.go.main.App.GetCV(cvId);
        currentCV = cv;
        renderEditor(cv);
        switchView('editor');
    } catch (error) {
        console.error('Failed to load CV:', error);
        showError('Failed to load CV');
    }
}

function renderEditor(cv) {
    const form = document.getElementById('editorContent');
    if (!form) return;

    form.innerHTML = `
        <h2>Personal Information</h2>
        <div class="form-group">
            <label class="form-label">First Name</label>
            <input type="text" class="form-input" id="firstname" value="${cv.firstname || ''}" placeholder="John">
        </div>

        <div class="form-group">
            <label class="form-label">Last Name</label>
            <input type="text" class="form-input" id="lastname" value="${cv.lastname || ''}" placeholder="Doe">
        </div>

        <div class="form-group">
            <label class="form-label">Job Title</label>
            <input type="text" class="form-input" id="job_title" value="${cv.job_title || ''}" placeholder="Software Engineer">
        </div>

        <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="email" value="${cv.email || ''}" placeholder="john.doe@example.com">
        </div>

        <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" class="form-input" id="phone" value="${cv.phone || ''}" placeholder="+49 123 456789">
        </div>

        <div class="form-group">
            <label class="form-label">Address</label>
            <input type="text" class="form-input" id="address" value="${cv.address || ''}" placeholder="Street, City, Country">
        </div>

        <h2 style="margin-top: 32px;">Professional Summary</h2>
        <div class="form-group">
            <textarea class="form-input form-textarea" id="summary" placeholder="Brief professional summary...">${cv.summary || ''}</textarea>
        </div>

        <h2 style="margin-top: 32px;">CV Settings</h2>
        <div class="form-group">
            <label class="form-label">Target Job</label>
            <input type="text" class="form-input" id="target_job" value="${cv.target_job || ''}" placeholder="Senior Software Engineer">
        </div>

        <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input" id="status">
                <option value="draft" ${cv.status === 'draft' ? 'selected' : ''}>Draft</option>
                <option value="ready" ${cv.status === 'ready' ? 'selected' : ''}>Ready</option>
                <option value="submitted" ${cv.status === 'submitted' ? 'selected' : ''}>Submitted</option>
                <option value="archived" ${cv.status === 'archived' ? 'selected' : ''}>Archived</option>
            </select>
        </div>

        <div class="form-group">
            <label class="form-label">Template</label>
            <select class="form-input" id="template">
                <option value="modern" ${cv.template === 'modern' ? 'selected' : ''}>Modern</option>
                <option value="classic" ${cv.template === 'classic' ? 'selected' : ''}>Classic</option>
                <option value="creative" ${cv.template === 'creative' ? 'selected' : ''}>Creative</option>
            </select>
        </div>

        <div class="form-group">
            <label class="form-label">Tags (comma-separated)</label>
            <input type="text" class="form-input" id="tags" value="${cv.tags ? cv.tags.join(', ') : ''}" placeholder="Remote, Senior, Full-time">
        </div>
    `;
}

async function saveCurrentCV() {
    if (!currentCV) return;

    try {
        // Collect form data
        currentCV.firstname = document.getElementById('firstname')?.value || '';
        currentCV.lastname = document.getElementById('lastname')?.value || '';
        currentCV.job_title = document.getElementById('job_title')?.value || '';
        currentCV.email = document.getElementById('email')?.value || '';
        currentCV.phone = document.getElementById('phone')?.value || '';
        currentCV.address = document.getElementById('address')?.value || '';
        currentCV.summary = document.getElementById('summary')?.value || '';
        currentCV.target_job = document.getElementById('target_job')?.value || '';
        currentCV.status = document.getElementById('status')?.value || 'draft';
        currentCV.template = document.getElementById('template')?.value || 'modern';

        // Parse tags
        const tagsInput = document.getElementById('tags')?.value || '';
        currentCV.tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

        // Save to backend
        await window.go.main.App.SaveCV(currentCV);

        showSuccess('CV saved successfully!');
        await loadDashboard();
    } catch (error) {
        console.error('Failed to save CV:', error);
        showError('Failed to save CV');
    }
}

async function exportCV(cvId) {
    try {
        const filename = await window.go.main.App.ExportPDF(cvId);
        showSuccess(`PDF exported: ${filename}`);
    } catch (error) {
        console.error('Failed to export CV:', error);
        showError('Failed to export PDF');
    }
}

async function deleteCV(cvId) {
    const message = window.i18n ? window.i18n.t('confirmations.deleteCV') : 'Bist du sicher, dass du diesen Lebenslauf löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.';
    const confirmed = await showCustomConfirm('Lebenslauf löschen?', message, 'error');
    if (!confirmed) {
        return;
    }

    try {
        await window.go.main.App.DeleteCV(cvId);
        await showSuccess('Lebenslauf erfolgreich gelöscht!');
        await loadDashboard();
    } catch (error) {
        console.error('Failed to delete CV:', error);
        await showError('Fehler beim Löschen des Lebenslaufs');
    }
}

// ==================== Notifications ====================

async function showSuccess(message) {
    console.log('✓', message);
    await showCustomAlert('Erfolg', message, 'success');
}

async function showError(message) {
    console.error('✗', message);
    await showCustomAlert('Fehler', message, 'error');
}

async function showInfo(message) {
    console.log('ℹ', message);
    await showCustomAlert('Information', message, 'info');
}

// ==================== Exit Button ====================

function setupExitButton() {
    const exitBtn = document.getElementById('exitBtn');
    if (exitBtn) {
        exitBtn.addEventListener('click', async () => {
            const message = window.i18n ? window.i18n.t('confirmations.exit') : 'Möchtest du CV Manager Pro wirklich beenden?';
            const confirmed = await showCustomConfirm('Beenden?', message, 'warning');
            if (confirmed) {
                window.runtime.Quit();
            }
        });
    }
}

// ==================== Onboarding Wizard ====================

function setupOnboarding() {
    const wizard = document.getElementById('onboardingWizard');
    const skipBtn = document.getElementById('skipOnboarding');
    const nextBtns = document.querySelectorAll('.onboarding-next');
    const prevBtns = document.querySelectorAll('.onboarding-prev');
    const finishBtn = document.querySelector('.onboarding-finish');

    let currentStep = 1;
    let selectedTheme = { template: 'classic', color: 'blue' }; // Default theme

    // Theme selection
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove selected class from all cards
            themeCards.forEach(c => c.classList.remove('selected'));
            // Add selected class to clicked card
            card.classList.add('selected');
            // Store selected theme
            selectedTheme = {
                template: card.getAttribute('data-template'),
                color: card.getAttribute('data-color')
            };
            console.log('Selected theme:', selectedTheme);
        });
    });

    // Select first theme by default
    if (themeCards.length > 0) {
        themeCards[0].classList.add('selected');
    }

    // Skip onboarding
    if (skipBtn) {
        skipBtn.addEventListener('click', async () => {
            wizard.style.display = 'none';
            localStorage.setItem('onboardingCompleted', 'true');

            // Mark as completed in backend
            try {
                await window.go.main.App.MarkOnboardingCompleted();
            } catch (error) {
                console.error('Failed to mark onboarding completed:', error);
            }
        });
    }

    // Next step
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep < 4) {
                document.querySelector(`.onboarding-step[data-step="${currentStep}"]`).style.display = 'none';
                currentStep++;
                document.querySelector(`.onboarding-step[data-step="${currentStep}"]`).style.display = 'block';
            }
        });
    });

    // Previous step
    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) {
                document.querySelector(`.onboarding-step[data-step="${currentStep}"]`).style.display = 'none';
                currentStep--;
                document.querySelector(`.onboarding-step[data-step="${currentStep}"]`).style.display = 'block';
            }
        });
    });

    // Finish onboarding
    if (finishBtn) {
        finishBtn.addEventListener('click', async () => {
            wizard.style.display = 'none';
            localStorage.setItem('onboardingCompleted', 'true');

            // Mark as completed in backend
            try {
                await window.go.main.App.MarkOnboardingCompleted();
            } catch (error) {
                console.error('Failed to mark onboarding completed:', error);
            }

            // Get input values from onboarding
            const firstName = document.getElementById('onb-firstName')?.value || 'Max';
            const lastName = document.getElementById('onb-lastName')?.value || 'Mustermann';
            const email = document.getElementById('onb-email')?.value || 'max@example.com';

            // Create first CV with selected theme and onboarding data
            await createFirstCVWithTheme(firstName, lastName, email, selectedTheme);
        });
    }
}

async function createFirstCVWithTheme(firstName, lastName, email, theme) {
    try {
        // Create empty CV first
        const createdCV = await window.go.main.App.CreateCV();

        // Update with user data
        createdCV.firstname = firstName || 'Max';
        createdCV.lastname = lastName || 'Mustermann';
        createdCV.email = email || 'max@example.com';
        createdCV.job_title = 'Berufstitel';
        createdCV.template = theme.template || 'modern';
        createdCV.color_scheme = theme.color || 'purple';

        // Save the updated CV
        await window.go.main.App.SaveCV(createdCV);

        console.log('Created first CV with theme:', theme);
        await showSuccess('Dein erster Lebenslauf wurde erstellt!');

        // Switch to dashboard to see the new CV
        switchView('dashboard');
        await loadDashboard();
    } catch (error) {
        console.error('Failed to create first CV:', error);
        await showError('Fehler beim Erstellen: ' + error.message);
    }
}

async function showOnboarding() {
    try {
        // Check backend app config
        const config = await window.go.main.App.GetAppConfig();

        // Show onboarding if first run or not shown yet
        if (config && (config.first_run || !config.onboarding_shown)) {
            const wizard = document.getElementById('onboardingWizard');
            if (wizard) {
                wizard.style.display = 'flex';
                // Reset to first step
                document.querySelectorAll('.onboarding-step').forEach((step, index) => {
                    step.style.display = index === 0 ? 'block' : 'none';
                });
            }
        }
    } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // Fallback to localStorage
        const onboardingCompleted = localStorage.getItem('onboardingCompleted');
        if (!onboardingCompleted) {
            const wizard = document.getElementById('onboardingWizard');
            if (wizard) {
                wizard.style.display = 'flex';
                document.querySelectorAll('.onboarding-step').forEach((step, index) => {
                    step.style.display = index === 0 ? 'block' : 'none';
                });
            }
        }
    }
}

// ==================== Storage Seal/Unseal ====================

async function loadSealStatus() {
    try {
        const sealStatus = await window.go.main.App.GetSealStatus();
        return sealStatus;
    } catch (error) {
        console.error('Failed to load seal status:', error);
        return { is_sealed: false, requires_password: false };
    }
}

async function sealStorage() {
    const password = prompt('Enter a master password to seal the storage:\n\nThis password will be required to access your data.');
    if (!password) {
        showInfo('Storage sealing cancelled');
        return;
    }

    const confirmPassword = prompt('Confirm your master password:');
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        await window.go.main.App.SealStorage(password);
        showSuccess('Storage sealed successfully! You will need the password to access your data.');
    } catch (error) {
        console.error('Failed to seal storage:', error);
        showError('Failed to seal storage');
    }
}

async function unsealStorage() {
    const password = prompt('Enter your master password to unseal the storage:');
    if (!password) {
        showInfo('Storage unsealing cancelled');
        return;
    }

    try {
        await window.go.main.App.UnsealStorage(password);
        showSuccess('Storage unsealed successfully!');
    } catch (error) {
        console.error('Failed to unseal storage:', error);
        showError('Incorrect password or failed to unseal storage');
    }
}

async function removeSeal() {
    const confirmed = await showCustomConfirm('Speichersiegelung entfernen?', 'Bist du sicher, dass du die Speichersiegelung entfernen möchtest?\n\nDies erlaubt Zugriff auf deine Daten ohne Passwort.', 'warning');
    if (!confirmed) {
        return;
    }

    const password = prompt('Gib dein aktuelles Master-Passwort ein:');
    if (!password) {
        await showInfo('Entfernung der Siegelung abgebrochen');
        return;
    }

    try {
        await window.go.main.App.RemoveSeal(password);
        await showSuccess('Speichersiegelung erfolgreich entfernt!');
    } catch (error) {
        console.error('Failed to remove seal:', error);
        await showError('Falsches Passwort oder Fehler beim Entfernen der Siegelung');
    }
}

// ========== Custom Modal System (Alert/Confirm) ==========

function showCustomAlert(title, message, iconType = 'info') {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const iconDiv = document.getElementById('customModalIcon');
        const titleDiv = document.getElementById('customModalTitle');
        const messageDiv = document.getElementById('customModalMessage');
        const buttonsDiv = document.getElementById('customModalButtons');

        // Set icon based on type
        let iconSVG = '';
        if (iconType === 'success') {
            iconSVG = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        } else if (iconType === 'error') {
            iconSVG = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        } else if (iconType === 'warning') {
            iconSVG = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        } else {
            iconSVG = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7f6df2" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }

        iconDiv.innerHTML = iconSVG;
        titleDiv.textContent = title;
        messageDiv.textContent = message;
        
        // Create OK button
        buttonsDiv.innerHTML = '<button class="btn-primary">OK</button>';
        
        const okBtn = buttonsDiv.querySelector('.btn-primary');
        okBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(true);
        };

        // Show modal
        modal.style.display = 'flex';
    });
}

function showCustomConfirm(title, message, iconType = 'warning') {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const iconDiv = document.getElementById('customModalIcon');
        const titleDiv = document.getElementById('customModalTitle');
        const messageDiv = document.getElementById('customModalMessage');
        const buttonsDiv = document.getElementById('customModalButtons');

        // Set icon
        let iconSVG = '';
        if (iconType === 'warning') {
            iconSVG = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        } else if (iconType === 'error') {
            iconSVG = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        } else {
            iconSVG = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7f6df2" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }

        iconDiv.innerHTML = iconSVG;
        titleDiv.textContent = title;
        messageDiv.textContent = message;
        
        // Create Yes/No buttons
        buttonsDiv.innerHTML = `
            <button class="btn-secondary" id="cancelBtn">Cancel</button>
            <button class="btn-primary" id="confirmBtn">Confirm</button>
        `;
        
        const cancelBtn = document.getElementById('cancelBtn');
        const confirmBtn = document.getElementById('confirmBtn');
        
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(false);
        };
        
        confirmBtn.onclick = () => {
            modal.style.display = 'none';
            resolve(true);
        };

        // Close on backdrop click
        const backdrop = modal.querySelector('.custom-modal-backdrop');
        backdrop.onclick = () => {
            modal.style.display = 'none';
            resolve(false);
        };

        // Show modal
        modal.style.display = 'flex';
    });
}

// Replace global alert and confirm (optional - can be used selectively)
// window.alert = (msg) => showCustomAlert('Alert', msg, 'info');
// window.confirm = (msg) => showCustomConfirm('Confirm', msg, 'warning');


// ==================== STATE-OF-THE-ART FEATURES ====================

// ========== Keyboard Shortcuts ==========
let undoStack = [];
let redoStack = [];
const MAX_UNDO_STACK = 50;

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', async (e) => {
        // Ctrl+S or Cmd+S: Save current CV
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            console.log('Keyboard: Save (Ctrl+S)');
            const currentView = document.querySelector('.view:not([style*="display: none"])');
            if (currentView && currentView.id === 'editorView') {
                await saveCurrentCV();
                await showSuccess('Gespeichert (Strg+S)');
            }
            return;
        }

        // Ctrl+Z: Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            console.log('Keyboard: Undo (Ctrl+Z)');
            performUndo();
            return;
        }

        // Ctrl+Shift+Z or Ctrl+Y: Redo
        if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
            ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
            e.preventDefault();
            console.log('Keyboard: Redo (Ctrl+Shift+Z)');
            performRedo();
            return;
        }

        // Ctrl+N: New CV
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            console.log('Keyboard: New CV (Ctrl+N)');
            switchView('dashboard');
            setTimeout(() => createNewCV(), 100);
            return;
        }

        // Ctrl+P: Export/Print
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            console.log('Keyboard: Export (Ctrl+P)');
            if (currentEditingCV) {
                await exportCV(currentEditingCV.id);
            }
            return;
        }

        // Ctrl+D: Duplicate current CV
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            console.log('Keyboard: Duplicate (Ctrl+D)');
            if (currentEditingCV) {
                await duplicateCV(currentEditingCV.id);
            }
            return;
        }

        // Ctrl+F: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            console.log('Keyboard: Search (Ctrl+F)');
            const searchInput = document.getElementById('cvSearch');
            if (searchInput) {
                searchInput.focus();
            }
            return;
        }

        // Ctrl+1-5: Switch views
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
            e.preventDefault();
            const views = ['dashboard', 'editor', 'visualEditor', 'privacy', 'settings'];
            const index = parseInt(e.key) - 1;
            if (views[index]) {
                console.log(`Keyboard: Switch to ${views[index]} (Ctrl+${e.key})`);
                switchView(views[index]);
            }
            return;
        }

        // Escape: Close modals or cancel
        if (e.key === 'Escape') {
            const modal = document.getElementById('customModal');
            if (modal && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
            return;
        }
    });

    console.log('Keyboard shortcuts initialized');
}

// ========== Auto-Save ==========
let autoSaveInterval = null;
let lastSaveState = null;
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

function setupAutoSave() {
    // Auto-save every 30 seconds
    autoSaveInterval = setInterval(async () => {
        if (currentEditingCV) {
            const currentState = JSON.stringify(currentEditingCV);
            if (currentState !== lastSaveState) {
                console.log('💾 Auto-saving...');
                try {
                    await window.go.main.App.SaveCV(currentEditingCV);
                    lastSaveState = currentState;
                    showAutoSaveIndicator();
                } catch (error) {
                    console.error('Auto-save failed:', error);
                }
            }
        }
    }, AUTO_SAVE_INTERVAL);

    console.log('Auto-save enabled (every 30s)');
}

function showAutoSaveIndicator() {
    // Show a subtle "Saved" indicator
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(127, 109, 242, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 9999;
        animation: fadeInOut 2s ease;
    `;
    indicator.textContent = '💾 Automatisch gespeichert';
    document.body.appendChild(indicator);

    setTimeout(() => {
        indicator.remove();
    }, 2000);
}

// ========== Undo/Redo System ==========
function addToUndoStack(state) {
    undoStack.push(JSON.parse(JSON.stringify(state)));
    if (undoStack.length > MAX_UNDO_STACK) {
        undoStack.shift();
    }
    redoStack = []; // Clear redo stack on new action
}

function performUndo() {
    if (undoStack.length === 0) {
        console.log('Nothing to undo');
        return;
    }

    const currentState = currentEditingCV;
    const previousState = undoStack.pop();

    redoStack.push(JSON.parse(JSON.stringify(currentState)));
    currentEditingCV = previousState;

    // Update UI with previous state
    populateEditorForm(previousState);
    showInfo('↶ Rückgängig');
}

function performRedo() {
    if (redoStack.length === 0) {
        console.log('Nothing to redo');
        return;
    }

    const currentState = currentEditingCV;
    const nextState = redoStack.pop();

    undoStack.push(JSON.parse(JSON.stringify(currentState)));
    currentEditingCV = nextState;

    // Update UI with next state
    populateEditorForm(nextState);
    showInfo('↷ Wiederherstellen');
}

// ========== Dark Mode Toggle ==========
let isDarkMode = true; // Default is dark

function setupDarkModeToggle() {
    // Check saved preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
        isDarkMode = savedMode === 'true';
    }

    // Apply initial mode
    applyDarkMode(isDarkMode);

    // Add toggle button to settings
    const settingsContent = document.querySelector('.settings-content');
    if (settingsContent) {
        const darkModeSection = document.createElement('div');
        darkModeSection.style.cssText = 'margin-top: 24px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px;';
        darkModeSection.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="font-size: 14px; margin-bottom: 4px;">Erscheinungsbild</h3>
                    <p style="font-size: 12px; color: var(--text-muted); margin: 0;">Wähle zwischen hellem und dunklem Modus</p>
                </div>
                <button id="darkModeToggle" class="btn-secondary" style="min-width: 100px;">
                    ${isDarkMode ? '🌙 Dunkel' : 'Hell'}
                </button>
            </div>
        `;
        settingsContent.appendChild(darkModeSection);

        // Add event listener
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                isDarkMode = !isDarkMode;
                localStorage.setItem('darkMode', isDarkMode);
                applyDarkMode(isDarkMode);
                toggleBtn.textContent = isDarkMode ? '🌙 Dunkel' : 'Hell';
                showSuccess(isDarkMode ? '🌙 Dunkler Modus aktiviert' : 'Heller Modus aktiviert');
            });
        }
    }

    console.log('Dark mode toggle initialized');
}

function applyDarkMode(dark) {
    const root = document.documentElement;
    if (dark) {
        // Dark mode (current)
        root.style.setProperty('--bg-primary', '#0f172a');
        root.style.setProperty('--bg-secondary', '#1e293b');
        root.style.setProperty('--bg-tertiary', '#334155');
        root.style.setProperty('--text-primary', '#f1f5f9');
        root.style.setProperty('--text-secondary', '#cbd5e1');
        root.style.setProperty('--text-muted', '#94a3b8');
    } else {
        // Light mode
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f8fafc');
        root.style.setProperty('--bg-tertiary', '#e2e8f0');
        root.style.setProperty('--text-primary', '#0f172a');
        root.style.setProperty('--text-secondary', '#475569');
        root.style.setProperty('--text-muted', '#64748b');
    }
}

// ========== CV Duplicate Function ==========
async function duplicateCV(cvId) {
    try {
        const original = await window.go.main.App.GetCV(cvId);

        // Create new empty CV
        const created = await window.go.main.App.CreateCV();

        // Copy all fields from original
        Object.assign(created, original);

        // Modify copied CV
        created.id = created.id; // Keep new ID
        created.job_title = original.job_title + ' (Kopie)';
        created.created_at = new Date().toISOString();

        // Save the duplicated CV
        await window.go.main.App.SaveCV(created);

        await showSuccess('Lebenslauf dupliziert!');
        await loadDashboard();
    } catch (error) {
        console.error('Failed to duplicate CV:', error);
        await showError('Fehler beim Duplizieren');
    }
}

// Alias functions for CV card actions
function editCV(cvId) {
    return openEditor(cvId);
}

function exportCVToPDF(cvId) {
    return exportCV(cvId);
}

// ========== Add CSS animation for auto-save ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(10px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);

console.log('All advanced features initialized');

// ==================== Quick Create CV ====================

function openQuickCreateModal() {
    const modal = document.getElementById('quickCreateModal');
    if (modal) {
        modal.style.display = 'flex';
        // Apply i18n if available
        if (window.i18n) {
            window.i18n.applyTranslations(modal);
        }
        // Focus first input
        setTimeout(() => {
            document.getElementById('qc-firstname')?.focus();
        }, 100);
    }
}

function closeQuickCreateModal() {
    const modal = document.getElementById('quickCreateModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        document.getElementById('quickCreateForm')?.reset();
    }
}

async function handleQuickCreateSubmit(e) {
    e.preventDefault();

    const formData = {
        firstname: document.getElementById('qc-firstname')?.value || '',
        lastname: document.getElementById('qc-lastname')?.value || '',
        email: document.getElementById('qc-email')?.value || '',
        job_title: document.getElementById('qc-job')?.value || '',
        phone: document.getElementById('qc-phone')?.value || '',
        template: document.getElementById('qc-template')?.value || 'modern',
        color_scheme: document.getElementById('qc-color')?.value || 'purple',
        status: 'draft'
    };

    try {
        console.log('[Quick Create] Creating CV with data:', formData);

        // Create new CV
        const newCV = await window.go.main.App.CreateCV();

        // Set all fields
        Object.assign(newCV, formData);

        // Save CV
        await window.go.main.App.SaveCV(newCV);

        console.log('[Quick Create] CV created successfully:', newCV.id);

        // Close modal
        closeQuickCreateModal();

        // Show success message
        await showSuccess(`Lebenslauf für ${formData.firstname} ${formData.lastname} erstellt!`);

        // Reload dashboard
        await loadDashboard();

        // Open editor with new CV
        await openEditor(newCV.id);

    } catch (error) {
        console.error('[Quick Create] Failed to create CV:', error);
        const errorMsg = error?.message || error?.toString() || 'Unbekannter Fehler';
        await showError('Fehler beim Erstellen: ' + errorMsg);
    }
}

function setupQuickCreate() {
    // Close button
    const closeBtn = document.getElementById('closeQuickCreate');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeQuickCreateModal);
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancelQuickCreate');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeQuickCreateModal);
    }

    // Form submit
    const form = document.getElementById('quickCreateForm');
    if (form) {
        form.addEventListener('submit', handleQuickCreateSubmit);
    }

    // Close on backdrop click
    const modal = document.getElementById('quickCreateModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('custom-modal-backdrop')) {
                closeQuickCreateModal();
            }
        });
    }

    // Add FAB button if not exists
    if (!document.querySelector('.quick-create-fab')) {
        const fab = document.createElement('button');
        fab.className = 'quick-create-fab';
        fab.title = 'Neuen Lebenslauf erstellen';
        fab.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `;
        fab.addEventListener('click', openQuickCreateModal);
        document.body.appendChild(fab);
    }

    console.log('Quick Create initialized');
}

// Call setup during initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupQuickCreate);
} else {
    setupQuickCreate();
}

// ==================== STATISTICS VIEW WITH CHARTS ====================

let statisticsCharts = {
    statusChart: null,
    categoryChart: null,
    templateChart: null
};

async function loadStatistics() {
    try {
        console.log('[Statistics] Loading statistics...');
        const stats = await window.go.main.App.GetStatistics();
        console.log('[Statistics] Stats loaded:', stats);

        if (!stats) {
            console.error('[Statistics] No stats returned');
            return;
        }

        // Update overview cards
        document.getElementById('stat-total-cvs').textContent = stats.total_cvs || 0;
        document.getElementById('stat-total-apps').textContent = 0; // TODO: Get from ApplicationsStatistics
        document.getElementById('stat-total-work').textContent = stats.total_work_experience || 0;
        document.getElementById('stat-total-edu').textContent = stats.total_education || 0;
        document.getElementById('stat-total-skills').textContent = stats.total_skills || 0;
        document.getElementById('stat-avg-work').textContent = (stats.avg_work_per_cv || 0).toFixed(1);

        // Render charts
        renderStatusDonutChart(stats.status_counts || {});
        renderCategoryDonutChart(stats.category_counts || {});
        renderTemplateBarChart(stats.template_counts || {});
        renderAverageBars(stats);
        renderStatsTable(stats);

        console.log('[Statistics] Charts rendered successfully');
    } catch (error) {
        console.error('[Statistics] Error loading statistics:', error);
        showError('Fehler beim Laden der Statistiken');
    }
}

function renderStatusDonutChart(statusCounts) {
    const ctx = document.getElementById('statusDonutChart');
    if (!ctx) return;

    // Destroy existing chart
    if (statisticsCharts.statusChart) {
        statisticsCharts.statusChart.destroy();
    }

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    const colors = {
        'draft': '#64748B',
        'ready': '#10B981',
        'submitted': '#3B82F6',
        'archived': '#6B7280'
    };

    statisticsCharts.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [{
                data: data,
                backgroundColor: labels.map(l => colors[l] || '#7f6df2'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Render legend
    const legendContainer = document.getElementById('statusLegend');
    if (legendContainer) {
        legendContainer.innerHTML = labels.map((label, i) => `
            <div class="legend-item">
                <span class="legend-color" style="background: ${colors[label] || '#7f6df2'}"></span>
                <span class="legend-label">${label.charAt(0).toUpperCase() + label.slice(1)}</span>
                <span class="legend-value">(${data[i]})</span>
            </div>
        `).join('');
    }
}

function renderCategoryDonutChart(categoryCounts) {
    const ctx = document.getElementById('categoryDonutChart');
    if (!ctx) return;

    if (statisticsCharts.categoryChart) {
        statisticsCharts.categoryChart.destroy();
    }

    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    const colors = ['#7f6df2', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'];

    statisticsCharts.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    const legendContainer = document.getElementById('categoryLegend');
    if (legendContainer) {
        legendContainer.innerHTML = labels.map((label, i) => `
            <div class="legend-item">
                <span class="legend-color" style="background: ${colors[i % colors.length]}"></span>
                <span class="legend-label">${label || 'Keine'}</span>
                <span class="legend-value">(${data[i]})</span>
            </div>
        `).join('');
    }
}

function renderTemplateBarChart(templateCounts) {
    const ctx = document.getElementById('templateBarChart');
    if (!ctx) return;

    if (statisticsCharts.templateChart) {
        statisticsCharts.templateChart.destroy();
    }

    const labels = Object.keys(templateCounts);
    const data = Object.values(templateCounts);

    statisticsCharts.templateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [{
                data: data,
                backgroundColor: '#7f6df2',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function renderAverageBars(stats) {
    const container = document.getElementById('avgBars');
    if (!container) return;

    const bars = [
        { label: 'Ø Berufserfahrung', value: stats.avg_work_per_cv || 0, max: 10 },
        { label: 'Ø Bildung', value: stats.avg_education_per_cv || 0, max: 5 },
        { label: 'Ø Fähigkeiten', value: stats.avg_skills_per_cv || 0, max: 15 }
    ];

    container.innerHTML = bars.map(bar => `
        <div class="h-bar-item">
            <div class="h-bar-label-row">
                <span class="h-bar-label">${bar.label}</span>
                <span class="h-bar-value">${bar.value.toFixed(1)}</span>
            </div>
            <div class="h-bar-track">
                <div class="h-bar-fill" style="width: ${(bar.value / bar.max) * 100}%"></div>
            </div>
        </div>
    `).join('');
}

function renderStatsTable(stats) {
    const container = document.getElementById('statsTable');
    if (!container) return;

    const allTags = stats.all_tags || [];

    container.innerHTML = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Metrik</th>
                    <th>Wert</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Lebensläufe Gesamt</td>
                    <td><strong>${stats.total_cvs || 0}</strong></td>
                </tr>
                <tr>
                    <td>Berufserfahrung Gesamt</td>
                    <td><strong>${stats.total_work_experience || 0}</strong></td>
                </tr>
                <tr>
                    <td>Bildungsabschlüsse Gesamt</td>
                    <td><strong>${stats.total_education || 0}</strong></td>
                </tr>
                <tr>
                    <td>Fähigkeiten Gesamt</td>
                    <td><strong>${stats.total_skills || 0}</strong></td>
                </tr>
                <tr>
                    <td>Tags Gesamt</td>
                    <td><strong>${allTags.length}</strong></td>
                </tr>
                <tr>
                    <td>Verwendete Tags</td>
                    <td>${allTags.join(', ') || 'Keine'}</td>
                </tr>
            </tbody>
        </table>
    `;
}

// ==================== APPLICATIONS MANAGEMENT ====================

let currentApplications = [];
let filteredApplications = [];

async function loadApplicationsView() {
    try {
        console.log('[Applications] Loading applications view...');

        // Load applications
        currentApplications = await window.go.main.App.GetAllApplications() || [];
        filteredApplications = [...currentApplications];

        // Load statistics
        const stats = await window.go.main.App.GetApplicationsStatistics();

        // Load CVs for dropdown
        const cvs = await window.go.main.App.GetAllCVs() || [];

        // Load portals
        const portals = await window.go.main.App.GetJobPortals() || [];

        // Populate portal dropdowns
        populatePortalDropdowns(portals);

        // Populate CV dropdown in modal
        populateCVDropdown(cvs);

        // Render statistics
        renderApplicationStats(stats);

        // Render timeline
        renderApplicationsTimeline(filteredApplications);

        console.log('[Applications] Loaded', currentApplications.length, 'applications');
    } catch (error) {
        console.error('[Applications] Error loading applications:', error);
        showError('Fehler beim Laden der Bewerbungen');
    }
}

function renderApplicationStats(stats) {
    if (!stats) return;

    const grid = document.getElementById('applicationStatsGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="stat-card-compact">
            <div class="stat-icon" style="background: rgba(127, 109, 242, 0.1);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7f6df2" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
            </div>
            <div class="stat-content">
                <span class="stat-label">Gesamt</span>
                <span class="stat-value">${stats.total_applications || 0}</span>
            </div>
        </div>
        <div class="stat-card-compact">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                </svg>
            </div>
            <div class="stat-content">
                <span class="stat-label">Interviews</span>
                <span class="stat-value">${stats.total_interviews || 0}</span>
            </div>
        </div>
        <div class="stat-card-compact">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <div class="stat-content">
                <span class="stat-label">Angebote</span>
                <span class="stat-value">${stats.total_offers || 0}</span>
            </div>
        </div>
        <div class="stat-card-compact">
            <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
            </div>
            <div class="stat-content">
                <span class="stat-label">Rücklaufquote</span>
                <span class="stat-value">${(stats.response_rate || 0).toFixed(0)}%</span>
            </div>
        </div>
    `;
}

function renderApplicationsTimeline(applications) {
    const timeline = document.getElementById('applicationsTimeline');
    if (!timeline) return;

    if (!applications || applications.length === 0) {
        timeline.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.3; margin-bottom: 16px;">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                <p style="font-size: 16px; margin-bottom: 8px;">Keine Bewerbungen vorhanden</p>
                <p style="font-size: 14px;">Klicke auf "Neue Bewerbung" um zu starten</p>
            </div>
        `;
        return;
    }

    // Sort by date (newest first)
    const sorted = [...applications].sort((a, b) => {
        const dateA = a.applied_date ? new Date(a.applied_date) : new Date(a.created_at);
        const dateB = b.applied_date ? new Date(b.applied_date) : new Date(b.created_at);
        return dateB - dateA;
    });

    timeline.innerHTML = sorted.map(app => createTimelineItem(app)).join('');
}

function createTimelineItem(app) {
    const statusColors = {
        'draft': '#64748B',
        'applied': '#3B82F6',
        'under_review': '#3B82F6',
        'interview_scheduled': '#F59E0B',
        'interviewed': '#F59E0B',
        'second_round': '#F59E0B',
        'offer': '#10B981',
        'accepted': '#10B981',
        'rejected': '#EF4444',
        'withdrawn': '#6B7280',
        'no_response': '#EF4444'
    };

    const statusLabels = {
        'draft': 'Entwurf',
        'applied': 'Beworben',
        'under_review': 'Wird geprüft',
        'interview_scheduled': 'Interview geplant',
        'interviewed': 'Interview abgeschlossen',
        'second_round': 'Zweite Runde',
        'offer': 'Angebot erhalten',
        'accepted': 'Angenommen',
        'rejected': 'Abgelehnt',
        'withdrawn': 'Zurückgezogen',
        'no_response': 'Keine Antwort'
    };

    const statusColor = statusColors[app.status] || '#64748B';
    const statusLabel = statusLabels[app.status] || app.status;

    const appliedDate = app.applied_date ? new Date(app.applied_date).toLocaleDateString('de-DE') : 'Noch nicht beworben';

    return `
        <div class="timeline-item" data-app-id="${app.id}">
            <div class="timeline-header">
                <div>
                    <div class="timeline-title">${app.job_title || 'Unbenannte Stelle'}</div>
                    <div class="timeline-company">${app.company || 'Unbekanntes Unternehmen'}</div>
                </div>
                <div class="timeline-meta">
                    <span class="timeline-badge" style="background: ${statusColor}; color: white;">${statusLabel}</span>
                    <span class="timeline-date">${appliedDate}</span>
                </div>
            </div>
            <div class="timeline-content">
                <div class="timeline-info">
                    ${app.location ? `
                        <div class="timeline-detail-row">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>${app.location}</span>
                        </div>
                    ` : ''}
                    ${app.portal ? `
                        <div class="timeline-detail-row">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>Portal: ${app.portal}</span>
                        </div>
                    ` : ''}
                    ${app.salary ? `
                        <div class="timeline-detail-row">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <span>${app.salary}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="timeline-actions">
                <button class="btn-small btn-edit" onclick="editApplication('${app.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Bearbeiten
                </button>
                ${app.portal_url ? `
                    <button class="btn-small" onclick="window.open('${app.portal_url}', '_blank')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        Stellenanzeige
                    </button>
                ` : ''}
                <button class="btn-small btn-delete" onclick="deleteApplication('${app.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Löschen
                </button>
            </div>
        </div>
    `;
}

function populatePortalDropdowns(portals) {
    const selects = [
        document.getElementById('applicationPortalFilter'),
        document.getElementById('app-portal')
    ];

    selects.forEach(select => {
        if (!select) return;

        const isFilter = select.id === 'applicationPortalFilter';

        if (isFilter) {
            select.innerHTML = '<option value="">Alle Portale</option>';
        } else {
            select.innerHTML = '<option value="">Portal auswählen...</option>';
        }

        portals.forEach(portal => {
            const option = document.createElement('option');
            option.value = portal;
            option.textContent = portal;
            select.appendChild(option);
        });
    });
}

function populateCVDropdown(cvs) {
    const select = document.getElementById('app-cv');
    if (!select) return;

    select.innerHTML = '<option value="">Lebenslauf auswählen...</option>';

    cvs.forEach(cv => {
        const option = document.createElement('option');
        option.value = cv.id;
        option.textContent = `${cv.firstname || ''} ${cv.lastname || ''} - ${cv.job_title || 'Kein Titel'}`.trim();
        select.appendChild(option);
    });
}

// Application Modal Functions
async function openNewApplicationModal() {
    const modal = document.getElementById('applicationModal');
    const form = document.getElementById('applicationForm');
    if (!modal || !form) return;

    // Reset form
    form.reset();
    document.getElementById('app-id').value = '';
    document.getElementById('applicationModalTitle').textContent = 'Neue Bewerbung';

    modal.style.display = 'flex';
}

async function editApplication(appId) {
    try {
        const app = await window.go.main.App.GetApplication(appId);
        if (!app) {
            showError('Bewerbung nicht gefunden');
            return;
        }

        const modal = document.getElementById('applicationModal');
        if (!modal) return;

        // Fill form
        document.getElementById('app-id').value = app.id;
        document.getElementById('app-job-title').value = app.job_title || '';
        document.getElementById('app-company').value = app.company || '';
        document.getElementById('app-location').value = app.location || '';
        document.getElementById('app-salary').value = app.salary || '';
        document.getElementById('app-job-type').value = app.job_type || 'Full-time';
        document.getElementById('app-remote').checked = app.remote || false;
        document.getElementById('app-hybrid').checked = app.hybrid || false;
        document.getElementById('app-cv').value = app.cv_id || '';
        document.getElementById('app-status').value = app.status || 'draft';
        document.getElementById('app-portal').value = app.portal || '';
        document.getElementById('app-priority').value = app.priority || 3;
        document.getElementById('app-portal-url').value = app.portal_url || '';
        document.getElementById('app-company-website').value = app.company_website || '';

        if (app.applied_date) {
            const date = new Date(app.applied_date);
            document.getElementById('app-applied-date').value = date.toISOString().split('T')[0];
        }

        if (app.deadline) {
            const date = new Date(app.deadline);
            document.getElementById('app-deadline').value = date.toISOString().split('T')[0];
        }

        document.getElementById('app-contact-name').value = app.contact_name || '';
        document.getElementById('app-contact-email').value = app.contact_email || '';
        document.getElementById('app-contact-phone').value = app.contact_phone || '';
        document.getElementById('app-notes').value = app.notes || '';
        document.getElementById('app-tags').value = (app.tags || []).join(', ');
        document.getElementById('app-job-description').value = app.job_description || '';

        document.getElementById('applicationModalTitle').textContent = 'Bewerbung bearbeiten';
        modal.style.display = 'flex';
    } catch (error) {
        console.error('[Applications] Error loading application:', error);
        showError('Fehler beim Laden der Bewerbung');
    }
}

async function deleteApplication(appId) {
    const confirmed = await showConfirm('Möchtest du diese Bewerbung wirklich löschen?');
    if (!confirmed) return;

    try {
        await window.go.main.App.DeleteApplication(appId);
        showSuccess('Bewerbung gelöscht');
        await loadApplicationsView();
    } catch (error) {
        console.error('[Applications] Error deleting application:', error);
        showError('Fehler beim Löschen');
    }
}

async function saveApplication(e) {
    e.preventDefault();

    try {
        const appId = document.getElementById('app-id').value;
        const isNew = !appId;

        let app;
        if (isNew) {
            app = await window.go.main.App.CreateApplication();
        } else {
            app = await window.go.main.App.GetApplication(appId);
        }

        // Update application data
        app.job_title = document.getElementById('app-job-title').value;
        app.company = document.getElementById('app-company').value;
        app.location = document.getElementById('app-location').value;
        app.salary = document.getElementById('app-salary').value;
        app.job_type = document.getElementById('app-job-type').value;
        app.remote = document.getElementById('app-remote').checked;
        app.hybrid = document.getElementById('app-hybrid').checked;
        app.cv_id = document.getElementById('app-cv').value;
        app.status = document.getElementById('app-status').value;
        app.portal = document.getElementById('app-portal').value;
        app.priority = parseInt(document.getElementById('app-priority').value) || 3;
        app.portal_url = document.getElementById('app-portal-url').value;
        app.company_website = document.getElementById('app-company-website').value;

        const appliedDate = document.getElementById('app-applied-date').value;
        if (appliedDate) {
            app.applied_date = new Date(appliedDate).toISOString();
        }

        const deadline = document.getElementById('app-deadline').value;
        if (deadline) {
            app.deadline = new Date(deadline).toISOString();
        }

        app.contact_name = document.getElementById('app-contact-name').value;
        app.contact_email = document.getElementById('app-contact-email').value;
        app.contact_phone = document.getElementById('app-contact-phone').value;
        app.notes = document.getElementById('app-notes').value;
        app.job_description = document.getElementById('app-job-description').value;

        const tagsInput = document.getElementById('app-tags').value;
        app.tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

        await window.go.main.App.SaveApplication(app);

        showSuccess(isNew ? 'Bewerbung erstellt' : 'Bewerbung gespeichert');
        closeApplicationModal();
        await loadApplicationsView();
    } catch (error) {
        console.error('[Applications] Error saving application:', error);
        showError('Fehler beim Speichern: ' + (error.message || error));
    }
}

function closeApplicationModal() {
    const modal = document.getElementById('applicationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Filter applications
function filterApplications() {
    const search = document.getElementById('applicationSearch').value.toLowerCase();
    const status = document.getElementById('applicationStatusFilter').value;
    const portal = document.getElementById('applicationPortalFilter').value;

    filteredApplications = currentApplications.filter(app => {
        const matchesSearch = !search ||
            (app.job_title && app.job_title.toLowerCase().includes(search)) ||
            (app.company && app.company.toLowerCase().includes(search)) ||
            (app.location && app.location.toLowerCase().includes(search));

        const matchesStatus = !status || app.status === status;
        const matchesPortal = !portal || app.portal === portal;

        return matchesSearch && matchesStatus && matchesPortal;
    });

    renderApplicationsTimeline(filteredApplications);
}

// Setup Applications Event Listeners
function setupApplications() {
    // New application button
    const newBtn = document.getElementById('newApplicationBtn');
    if (newBtn) {
        newBtn.addEventListener('click', openNewApplicationModal);
    }

    // Modal close buttons
    const closeBtn = document.getElementById('closeApplicationModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeApplicationModal);
    }

    const cancelBtn = document.getElementById('cancelApplication');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeApplicationModal);
    }

    // Form submit
    const form = document.getElementById('applicationForm');
    if (form) {
        form.addEventListener('submit', saveApplication);
    }

    // Filters
    const searchInput = document.getElementById('applicationSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterApplications);
    }

    const statusFilter = document.getElementById('applicationStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterApplications);
    }

    const portalFilter = document.getElementById('applicationPortalFilter');
    if (portalFilter) {
        portalFilter.addEventListener('change', filterApplications);
    }

    console.log('[Applications] Event listeners setup complete');
}

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupApplications);
} else {
    setupApplications();
}

// ==================== Version & Updates Management ====================

async function updateSplashVersion() {
    try {
        const buildInfo = await window.go.main.App.GetBuildInfo();
        const versionEl = document.getElementById('splashVersion');
        const buildEl = document.getElementById('splashBuild');

        if (versionEl) {
            versionEl.textContent = `Version ${buildInfo.version}`;
        }
        if (buildEl && buildInfo.build_time !== 'unknown') {
            const buildDate = new Date(buildInfo.build_time);
            buildEl.textContent = `Build ${buildInfo.build_number} - ${buildDate.toLocaleDateString('de-DE')}`;
        }
    } catch (error) {
        console.error('[Version] Error loading version:', error);
    }
}

async function loadUpdatesView() {
    try {
        console.log('[Updates] Loading updates view...');

        const buildInfo = await window.go.main.App.GetBuildInfo();
        const changelog = await window.go.main.App.GetChangeLog();

        // Update current version banner
        const versionNumber = document.getElementById('currentVersionNumber');
        const buildInfoText = document.getElementById('buildInfoText');

        if (versionNumber) {
            versionNumber.textContent = `v${buildInfo.version}`;
        }
        if (buildInfoText && buildInfo.build_time !== 'unknown') {
            const buildDate = new Date(buildInfo.build_time);
            buildInfoText.textContent = `Build #${buildInfo.build_number} - ${buildDate.toLocaleDateString('de-DE', {year: 'numeric', month: 'long', day: 'numeric'})}`;
        }

        // Render changelog
        renderUpdateHistory(changelog);

        console.log('[Updates] Loaded', changelog.length, 'changelog entries');
    } catch (error) {
        console.error('[Updates] Error loading updates:', error);
        showError('Fehler beim Laden der Updates');
    }
}

function renderUpdateHistory(changelog) {
    const container = document.getElementById('updateHistoryList');
    if (!container) return;

    if (!changelog || changelog.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Keine Updates verfügbar</p>';
        return;
    }

    container.innerHTML = changelog.map((entry, index) => {
        const isLatest = index === 0;
        return `
            <div class="update-entry ${isLatest ? 'latest' : ''}">
                <div class="update-header">
                    <div class="update-version-badge ${isLatest ? 'current' : ''}">
                        v${entry.version}
                        ${isLatest ? '<span class="badge-latest">Aktuell</span>' : ''}
                    </div>
                    <div class="update-date">${entry.date}</div>
                </div>
                <h3 class="update-title">${entry.description}</h3>
                <ul class="update-changes">
                    ${entry.changes.map(change => `<li>${change}</li>`).join('')}
                </ul>
            </div>
        `;
    }).join('');
}

// Update switchView to handle updates view
const originalSwitchView = switchView;
switchView = function(viewName) {
    originalSwitchView(viewName);
    if (viewName === 'updates') {
        loadUpdatesView();
    }
};

// Initialize version display on splash screen
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateSplashVersion);
} else {
    updateSplashVersion();
}

