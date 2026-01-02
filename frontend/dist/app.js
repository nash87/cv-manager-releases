// CV Manager - Complete Frontend Application Logic with GDPR
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
    console.log('CV Manager - Encrypted & GDPR Compliant - Initializing...');

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
        setupLanguageToggle();
        setupDashboardListeners();
        await new Promise(resolve => setTimeout(resolve, 150));

        updateSplashStatus('Lade Datenschutz-Module...', 70);
        setupPrivacyListeners();
        setupVisualEditorListeners();
        await new Promise(resolve => setTimeout(resolve, 150));

        updateSplashStatus('Initialisiere Einstellungen...', 80);
        setupSettingsListeners();
        setupExitButton();
        setupKeyboardShortcuts();
        setupAutoSave();
        setupDarkModeToggle();
        await new Promise(resolve => setTimeout(resolve, 150));

        // Step 5: Final initialization
        updateSplashStatus('Finalisiere...', 90);
        await new Promise(resolve => setTimeout(resolve, 200));

        console.log('CV Manager ready!');

        // Hide splash screen
        await hideSplash();
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
            defaultCV.summary = 'Professioneller Lebenslauf erstellt mit CV Manager';
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

function setupLanguageToggle() {
    const langToggle = document.getElementById('langToggle');
    const langIndicator = document.getElementById('langIndicator');

    if (!langToggle || !langIndicator) return;

    // Set initial language indicator
    const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : 'de';
    langIndicator.textContent = currentLang.toUpperCase();

    langToggle.addEventListener('click', () => {
        if (!window.i18n) return;

        const current = window.i18n.getCurrentLanguage();
        const newLang = current === 'de' ? 'en' : 'de';
        window.i18n.setLanguage(newLang);
        langIndicator.textContent = newLang.toUpperCase();

        // Show toast notification
        showToast(newLang === 'de' ? 'Sprache: Deutsch' : 'Language: English', 'success');
    });

    // Listen for language changes from other sources
    window.addEventListener('languageChanged', (e) => {
        langIndicator.textContent = e.detail.language.toUpperCase();
    });
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
        } else if (viewName === 'audit') {
            if (window.AuditManager) {
                window.AuditManager.init();
            }
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

// ==================== WYSIWYG Builder PRO ====================

let autoSaveTimeout = null;
let currentColorScheme = 'blue';
let currentTemplate = 'modern';
let undoStack = [];
let redoStack = [];
let isPreviewMode = false;
let currentFontSize = 12;
let currentLineHeight = 1.5;
let currentMargin = 40;
let currentPhotoStyle = 'rounded';
let currentAccentStrength = 'medium';

// History State Management
function saveToHistory() {
    if (!visualEditorCurrentCV) return;
    const state = JSON.stringify(visualEditorCurrentCV);
    undoStack.push(state);
    if (undoStack.length > 50) undoStack.shift(); // Limit history
    redoStack = []; // Clear redo on new action
    updateUndoRedoButtons();
}

function undo() {
    if (undoStack.length === 0 || !visualEditorCurrentCV) return;
    const currentState = JSON.stringify(visualEditorCurrentCV);
    redoStack.push(currentState);
    const previousState = undoStack.pop();
    visualEditorCurrentCV = JSON.parse(previousState);
    refreshCVDisplay();
    updateUndoRedoButtons();
    showAutoSaveIndicator('Rückgängig');
}

function redo() {
    if (redoStack.length === 0 || !visualEditorCurrentCV) return;
    const currentState = JSON.stringify(visualEditorCurrentCV);
    undoStack.push(currentState);
    const nextState = redoStack.pop();
    visualEditorCurrentCV = JSON.parse(nextState);
    refreshCVDisplay();
    updateUndoRedoButtons();
    showAutoSaveIndicator('Wiederherstellt');
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

function setupVisualEditorEventListeners() {
    // CV Selection
    const cvSelect = document.getElementById('visualEditorCVSelect');
    if (cvSelect) {
        cvSelect.addEventListener('change', async (e) => {
            if (e.target.value) {
                await loadCVIntoBuilder(e.target.value);
            }
        });
    }

    // Undo/Redo buttons
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);

    // Export dropdown
    document.querySelectorAll('.export-option').forEach(opt => {
        opt.addEventListener('click', async () => {
            const format = opt.dataset.format;
            if (visualEditorCurrentCV) {
                if (format === 'pdf') {
                    await exportCV(visualEditorCurrentCV.id);
                } else {
                    showAutoSaveIndicator(format.toUpperCase() + ' Export kommt bald');
                }
            }
        });
    });

    // Zoom controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomDisplay = document.getElementById('zoomLevel');

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            visualEditorZoom = Math.min(150, visualEditorZoom + 10);
            updateBuilderZoom();
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            visualEditorZoom = Math.max(50, visualEditorZoom - 10);
            updateBuilderZoom();
        });
    }

    if (zoomDisplay) {
        zoomDisplay.addEventListener('click', () => {
            visualEditorZoom = 100;
            updateBuilderZoom();
        });
    }

    // Preview mode toggle
    const previewBtn = document.getElementById('previewModeBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', togglePreviewMode);
    }

    // Template dropdown
    const templateTrigger = document.getElementById('templateTrigger');
    const templateMenu = document.getElementById('templateMenu');
    const templateName = document.getElementById('templateName');

    if (templateTrigger && templateMenu) {
        templateTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            templateMenu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.template-dropdown')) {
                templateMenu.classList.remove('show');
            }
        });

        // Template options
        document.querySelectorAll('.template-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.template-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                currentTemplate = option.dataset.template;
                if (templateName) {
                    // Get template name from strong element or template-info
                    const nameEl = option.querySelector('strong') || option.querySelector('.template-name');
                    if (nameEl) {
                        templateName.textContent = nameEl.textContent;
                    }
                }
                applyTemplate(currentTemplate);
                templateMenu.classList.remove('show');
                saveToHistory();
                triggerAutoSave();
            });
        });
    }

    // Skills display style selector
    const skillsDisplaySelect = document.getElementById('skillsDisplayStyle');
    if (skillsDisplaySelect) {
        skillsDisplaySelect.addEventListener('change', (e) => {
            applySkillsDisplayStyle(e.target.value);
            triggerAutoSave();
        });
    }

    // Languages display style selector
    const langDisplaySelect = document.getElementById('langDisplayStyle');
    if (langDisplaySelect) {
        langDisplaySelect.addEventListener('change', (e) => {
            applyLanguagesDisplayStyle(e.target.value);
            triggerAutoSave();
        });
    }

    // Section settings buttons
    document.querySelectorAll('.section-settings-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const section = btn.closest('.cv-section');
            if (section) {
                openSectionSettings(section.id || section.dataset.section);
            }
        });
    });

    // Editable section titles
    document.querySelectorAll('.sec-title-text[contenteditable="true"]').forEach(titleEl => {
        titleEl.addEventListener('blur', () => {
            const sectionTitle = titleEl.closest('.sec-title');
            if (sectionTitle) {
                const defaultText = sectionTitle.dataset.default;
                if (titleEl.textContent.trim() === '') {
                    titleEl.textContent = defaultText;
                }
            }
            triggerAutoSave();
        });

        titleEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                titleEl.blur();
            }
        });
    });

    // Color swatches
    document.querySelectorAll('.color-swatch:not(.custom-color)').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            currentColorScheme = swatch.dataset.color;
            applyColorScheme(currentColorScheme);
            saveToHistory();
            triggerAutoSave();
        });
    });

    // Custom color picker
    const customColorBtn = document.getElementById('customColorBtn');
    const customColorPicker = document.getElementById('customColorPicker');
    if (customColorBtn && customColorPicker) {
        customColorBtn.addEventListener('click', () => customColorPicker.click());
        customColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            document.documentElement.style.setProperty('--cv-accent-custom', color);
            const canvas = document.getElementById('cvCanvas');
            if (canvas) {
                canvas.style.setProperty('--cv-accent', color);
            }
        });
    }

    // Panel tabs
    document.querySelectorAll('.panel-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            const panel = document.querySelector(`.panel-section[data-panel="${tab.dataset.panel}"]`);
            if (panel) panel.classList.add('active');
        });
    });

    // Property controls
    setupPropertyControls();

    // Setup inline editing
    setupLiveEditing();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    // Setup context menu
    setupContextMenu();

    // Setup floating toolbar
    setupFloatingToolbar();

    // Setup drag and drop
    setupDragAndDrop();

    // Photo upload
    setupPhotoUpload();

    // Add section button
    const addSectionBtn = document.getElementById('addSectionBtn');
    if (addSectionBtn) {
        addSectionBtn.addEventListener('click', openAddSectionModal);
    }

    // Navigator toggle
    const navToggle = document.getElementById('navToggle');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const nav = document.getElementById('sectionNavigator');
            if (nav) nav.classList.toggle('collapsed');
        });
    }
}

function setupPropertyControls() {
    // Font select
    const fontSelect = document.getElementById('fontSelect');
    if (fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            const canvas = document.getElementById('cvCanvas');
            if (canvas) {
                document.querySelector('.cv-document').style.fontFamily = `'${e.target.value}', sans-serif`;
            }
            triggerAutoSave();
        });
    }

    // Font size slider
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', (e) => {
            currentFontSize = parseInt(e.target.value);
            if (fontSizeValue) fontSizeValue.textContent = currentFontSize + 'px';
            const doc = document.querySelector('.cv-document');
            if (doc) doc.style.fontSize = currentFontSize + 'px';
            triggerAutoSave();
        });
    }

    // Line height slider
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const lineHeightValue = document.getElementById('lineHeightValue');
    if (lineHeightSlider) {
        lineHeightSlider.addEventListener('input', (e) => {
            currentLineHeight = parseFloat(e.target.value);
            if (lineHeightValue) lineHeightValue.textContent = currentLineHeight.toFixed(1);
            const doc = document.querySelector('.cv-document');
            if (doc) doc.style.lineHeight = currentLineHeight;
            triggerAutoSave();
        });
    }

    // Margin slider
    const marginSlider = document.getElementById('marginSlider');
    const marginValue = document.getElementById('marginValue');
    if (marginSlider) {
        marginSlider.addEventListener('input', (e) => {
            currentMargin = parseInt(e.target.value);
            if (marginValue) marginValue.textContent = currentMargin + 'px';
            const doc = document.querySelector('.cv-document');
            if (doc) doc.style.padding = currentMargin + 'px';
            triggerAutoSave();
        });
    }

    // Accent strength buttons
    document.querySelectorAll('[data-accent]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-accent]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentAccentStrength = btn.dataset.accent;
            // Apply accent strength to CV
            triggerAutoSave();
        });
    });

    // Photo style buttons
    document.querySelectorAll('[data-photo]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-photo]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPhotoStyle = btn.dataset.photo;
            const canvas = document.getElementById('cvCanvas');
            if (canvas) canvas.setAttribute('data-photo', currentPhotoStyle);
            triggerAutoSave();
        });
    });

    // Contact visibility checkboxes
    ['showEmail', 'showPhone', 'showLocation', 'showLinkedin', 'showWebsite'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                const field = id.replace('show', '').toLowerCase();
                const chip = document.querySelector(`.contact-chip[data-field="${field}"]`);
                if (chip) {
                    chip.style.display = checkbox.checked ? 'inline-flex' : 'none';
                }
            });
        }
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only in visual editor
        if (document.getElementById('visualEditorView')?.classList.contains('active') === false) return;

        // Ctrl+S - Save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveCurrentCVChanges();
            showAutoSaveIndicator('Gespeichert');
        }

        // Ctrl+Z - Undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }

        // Ctrl+Y or Ctrl+Shift+Z - Redo
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            redo();
        }

        // P - Preview mode
        if (e.key === 'p' && !e.ctrlKey && !isEditingText()) {
            e.preventDefault();
            togglePreviewMode();
        }

        // ? - Show shortcuts
        if (e.key === '?' && !isEditingText()) {
            e.preventDefault();
            toggleShortcutsHelp();
        }

        // Escape - Close modals
        if (e.key === 'Escape') {
            closeItemModal();
            closeAddSectionModal();
            hideContextMenu();
            hideFloatingToolbar();
            if (isPreviewMode) togglePreviewMode();
        }
    });
}

function isEditingText() {
    const active = document.activeElement;
    return active && (active.isContentEditable || active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
}

function togglePreviewMode() {
    isPreviewMode = !isPreviewMode;
    const builder = document.querySelector('.wysiwyg-builder-pro');
    const btn = document.getElementById('previewModeBtn');

    if (builder) {
        builder.classList.toggle('preview-mode', isPreviewMode);
    }
    if (btn) {
        btn.classList.toggle('active', isPreviewMode);
    }
}

function toggleShortcutsHelp() {
    const help = document.getElementById('shortcutsHelp');
    if (help) {
        help.style.display = help.style.display === 'none' ? 'block' : 'none';
    }
}

function closeItemModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.remove('visible');
    }
}

function closeAddSectionModal() {
    const modal = document.getElementById('addSectionModal');
    if (modal) {
        modal.classList.remove('visible');
    }
}

function openAddSectionModal() {
    const modal = document.getElementById('addSectionModal');
    if (modal) {
        modal.classList.add('visible');
    }
}

function setupContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (!contextMenu) return;

    // Hide on click outside
    document.addEventListener('click', () => hideContextMenu());
    document.addEventListener('contextmenu', (e) => {
        const item = e.target.closest('.timeline-item, .skill-tag, .language-item');
        if (item && !isPreviewMode) {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, item);
        }
    });

    // Context menu actions
    contextMenu.querySelectorAll('.context-menu-item').forEach(menuItem => {
        menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = menuItem.dataset.action;
            const targetItem = contextMenu.targetItem;

            if (!targetItem) return;

            switch(action) {
                case 'edit':
                    const idx = targetItem.dataset.index;
                    if (targetItem.classList.contains('experience-item') || targetItem.closest('.experience-list, #experienceItems')) {
                        editExperienceItem(parseInt(idx));
                    } else if (targetItem.classList.contains('education-item') || targetItem.closest('.education-list, #educationItems')) {
                        editEducationItem(parseInt(idx));
                    } else if (targetItem.classList.contains('skill-tag')) {
                        editSkillItem(parseInt(idx));
                    }
                    break;
                case 'duplicate':
                    duplicateItem(targetItem);
                    break;
                case 'moveUp':
                    moveItemUp(targetItem);
                    break;
                case 'moveDown':
                    moveItemDown(targetItem);
                    break;
                case 'delete':
                    deleteItem(targetItem);
                    break;
            }
            hideContextMenu();
        });
    });
}

function showContextMenu(x, y, item) {
    const menu = document.getElementById('contextMenu');
    if (!menu) return;

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'block';
    menu.targetItem = item;

    // Adjust position if off-screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = (y - rect.height) + 'px';
    }
}

function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) menu.style.display = 'none';
}

function setupFloatingToolbar() {
    const toolbar = document.getElementById('floatingToolbar');
    if (!toolbar) return;

    // Show on text selection
    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Check if selection is in editable area
            const container = range.commonAncestorContainer.parentElement;
            if (container && (container.classList?.contains('live-edit') || container.closest('.live-edit'))) {
                showFloatingToolbar(rect.left + rect.width / 2, rect.top - 10);
            } else {
                hideFloatingToolbar();
            }
        } else {
            hideFloatingToolbar();
        }
    });

    // Format buttons
    toolbar.querySelectorAll('.fmt-btn').forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent blur
            const cmd = btn.dataset.cmd;

            switch(cmd) {
                case 'bold':
                    document.execCommand('bold');
                    break;
                case 'italic':
                    document.execCommand('italic');
                    break;
                case 'underline':
                    document.execCommand('underline');
                    break;
                case 'link':
                    const url = prompt('Link URL:');
                    if (url) document.execCommand('createLink', false, url);
                    break;
                case 'highlight':
                    document.execCommand('backColor', false, 'yellow');
                    break;
            }
        });
    });
}

function showFloatingToolbar(x, y) {
    const toolbar = document.getElementById('floatingToolbar');
    if (!toolbar || isPreviewMode) return;

    toolbar.style.left = x + 'px';
    toolbar.style.top = y + 'px';
    toolbar.style.transform = 'translate(-50%, -100%)';
    toolbar.style.display = 'flex';
}

function hideFloatingToolbar() {
    const toolbar = document.getElementById('floatingToolbar');
    if (toolbar) toolbar.style.display = 'none';
}

function setupDragAndDrop() {
    // Section drag and drop in navigator
    const navSections = document.getElementById('navSections');
    if (navSections) {
        navSections.addEventListener('dragstart', handleNavDragStart);
        navSections.addEventListener('dragover', handleNavDragOver);
        navSections.addEventListener('drop', handleNavDrop);
        navSections.addEventListener('dragend', handleNavDragEnd);
    }

    // CV section drag and drop
    const cvDocument = document.getElementById('cvDocument');
    if (cvDocument) {
        cvDocument.addEventListener('dragstart', handleSectionDragStart);
        cvDocument.addEventListener('dragover', handleSectionDragOver);
        cvDocument.addEventListener('drop', handleSectionDrop);
        cvDocument.addEventListener('dragend', handleSectionDragEnd);
    }
}

let draggedElement = null;

function handleNavDragStart(e) {
    const item = e.target.closest('.nav-section-item');
    if (!item) return;

    draggedElement = item;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleNavDragOver(e) {
    e.preventDefault();
    const item = e.target.closest('.nav-section-item');
    if (item && item !== draggedElement) {
        const rect = item.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) {
            item.parentNode.insertBefore(draggedElement, item);
        } else {
            item.parentNode.insertBefore(draggedElement, item.nextSibling);
        }
    }
}

function handleNavDrop(e) {
    e.preventDefault();
    // Update section order in CV data
    updateSectionOrder();
}

function handleNavDragEnd(e) {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
}

function handleSectionDragStart(e) {
    const section = e.target.closest('.cv-sec[data-draggable="true"]');
    if (!section) return;

    draggedElement = section;
    section.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleSectionDragOver(e) {
    e.preventDefault();
    const section = e.target.closest('.cv-sec');
    if (section && section !== draggedElement && section.dataset.draggable === 'true') {
        section.classList.add('drag-over');
    }
}

function handleSectionDrop(e) {
    e.preventDefault();
    const section = e.target.closest('.cv-sec');
    if (section && section !== draggedElement) {
        section.classList.remove('drag-over');
        const rect = section.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) {
            section.parentNode.insertBefore(draggedElement, section);
        } else {
            section.parentNode.insertBefore(draggedElement, section.nextSibling);
        }
        updateSectionOrder();
    }
}

function handleSectionDragEnd(e) {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
    document.querySelectorAll('.cv-sec').forEach(s => s.classList.remove('drag-over'));
}

function updateSectionOrder() {
    // Update the CV's section order based on current DOM order
    const sections = document.querySelectorAll('.cv-sec[data-section]');
    const order = Array.from(sections).map(s => s.dataset.section);
    if (visualEditorCurrentCV) {
        visualEditorCurrentCV.section_order = order;
        saveToHistory();
        triggerAutoSave();
    }
}

function setupPhotoUpload() {
    const photoInput = document.getElementById('photoInput');
    const uploadBtn = document.getElementById('photoUploadBtn');
    const removeBtn = document.getElementById('photoRemoveBtn');

    if (uploadBtn && photoInput) {
        uploadBtn.addEventListener('click', () => photoInput.click());

        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // Read file as base64
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const base64 = e.target.result;

                    // Update display
                    const photoImg = document.getElementById('photoImg');
                    const photoPlaceholder = document.getElementById('photoPlaceholder');

                    if (photoImg && photoPlaceholder) {
                        photoImg.src = base64;
                        photoImg.style.display = 'block';
                        photoPlaceholder.style.display = 'none';
                        if (removeBtn) removeBtn.style.display = 'block';
                    }

                    // Save to backend if we have Wails API
                    if (visualEditorCurrentCV && window.go?.main?.App?.UploadPhoto) {
                        try {
                            const result = await window.go.main.App.UploadPhoto(visualEditorCurrentCV.id, file.name, base64.split(',')[1]);
                            visualEditorCurrentCV.photo_path = result;
                        } catch (err) {
                            console.error('Photo upload failed:', err);
                        }
                    }

                    saveToHistory();
                    triggerAutoSave();
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error uploading photo:', error);
            }
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            const photoImg = document.getElementById('photoImg');
            const photoPlaceholder = document.getElementById('photoPlaceholder');

            if (photoImg && photoPlaceholder) {
                photoImg.src = '';
                photoImg.style.display = 'none';
                photoPlaceholder.style.display = 'flex';
                removeBtn.style.display = 'none';
            }

            if (visualEditorCurrentCV) {
                visualEditorCurrentCV.photo_path = '';
            }

            saveToHistory();
            triggerAutoSave();
        });
    }
}

function setupLiveEditing() {
    // Delegate events to the document for dynamically created elements
    document.addEventListener('focus', (e) => {
        if (e.target.classList?.contains('live-edit')) {
            e.target.dataset.originalValue = e.target.textContent;
        }
    }, true);

    document.addEventListener('blur', (e) => {
        if (e.target.classList?.contains('live-edit')) {
            const field = e.target.dataset.field;
            const newValue = e.target.textContent.trim();
            const originalValue = e.target.dataset.originalValue;

            if (newValue !== originalValue && visualEditorCurrentCV) {
                saveToHistory();
                updateCVField(field, newValue);
                triggerAutoSave();
            }
        }
    }, true);

    document.addEventListener('keydown', (e) => {
        if (e.target.classList?.contains('live-edit')) {
            // Enter to confirm (for single-line fields)
            if (e.key === 'Enter' && !e.target.classList.contains('multiline')) {
                e.preventDefault();
                e.target.blur();
            }
            // Escape to cancel
            if (e.key === 'Escape') {
                e.target.textContent = e.target.dataset.originalValue || '';
                e.target.blur();
            }
        }
    });
}

function duplicateItem(item) {
    if (!visualEditorCurrentCV) return;

    const idx = parseInt(item.dataset.index);

    if (item.closest('#experienceItems') || item.classList.contains('experience-item')) {
        const exp = visualEditorCurrentCV.work_experience[idx];
        if (exp) {
            visualEditorCurrentCV.work_experience.splice(idx + 1, 0, {...exp});
            renderExperienceList(visualEditorCurrentCV.work_experience);
        }
    } else if (item.closest('#educationItems') || item.classList.contains('education-item')) {
        const edu = visualEditorCurrentCV.education[idx];
        if (edu) {
            visualEditorCurrentCV.education.splice(idx + 1, 0, {...edu});
            renderEducationList(visualEditorCurrentCV.education);
        }
    }

    saveToHistory();
    triggerAutoSave();
}

function moveItemUp(item) {
    const idx = parseInt(item.dataset.index);
    if (idx === 0) return;

    if (item.closest('#experienceItems')) {
        const arr = visualEditorCurrentCV.work_experience;
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        renderExperienceList(arr);
    } else if (item.closest('#educationItems')) {
        const arr = visualEditorCurrentCV.education;
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        renderEducationList(arr);
    }

    saveToHistory();
    triggerAutoSave();
}

function moveItemDown(item) {
    const idx = parseInt(item.dataset.index);

    if (item.closest('#experienceItems')) {
        const arr = visualEditorCurrentCV.work_experience;
        if (idx >= arr.length - 1) return;
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        renderExperienceList(arr);
    } else if (item.closest('#educationItems')) {
        const arr = visualEditorCurrentCV.education;
        if (idx >= arr.length - 1) return;
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        renderEducationList(arr);
    }

    saveToHistory();
    triggerAutoSave();
}

function deleteItem(item) {
    const idx = parseInt(item.dataset.index);

    if (item.closest('#experienceItems')) {
        deleteExperienceItem(idx);
    } else if (item.closest('#educationItems')) {
        deleteEducationItem(idx);
    } else if (item.classList.contains('skill-tag')) {
        deleteSkillItem(idx);
    } else if (item.classList.contains('language-item')) {
        deleteLanguageItem(idx);
    }
}

function openAddSectionModal() {
    const modal = document.getElementById('addSectionModal');
    if (modal) modal.style.display = 'flex';
}

function closeAddSectionModal() {
    const modal = document.getElementById('addSectionModal');
    if (modal) modal.style.display = 'none';
}

window.closeAddSectionModal = closeAddSectionModal;
window.openAddSectionModal = openAddSectionModal;
window.closeItemModal = closeItemModal;
window.toggleShortcutsHelp = toggleShortcutsHelp;
window.togglePreviewMode = togglePreviewMode;
window.applyColorScheme = applyColorScheme;
window.applyTemplate = applyTemplate;
window.undo = undo;
window.redo = redo;
window.applySkillsDisplayStyle = applySkillsDisplayStyle;
window.applyLanguagesDisplayStyle = applyLanguagesDisplayStyle;
window.openSectionSettings = openSectionSettings;
window.closeSectionSettings = closeSectionSettings;
window.saveSectionSettings = saveSectionSettings;

async function loadCVIntoBuilder(cvId) {
    console.log('[Builder] Loading CV:', cvId);

    const loadingEl = document.getElementById('canvasLoading');
    const documentEl = document.getElementById('cvDocument');
    const cvCanvas = document.getElementById('cvCanvas');

    if (loadingEl) loadingEl.style.display = 'flex';
    if (documentEl) documentEl.style.display = 'none';

    // Reset history
    undoStack = [];
    redoStack = [];
    updateUndoRedoButtons();

    try {
        const cv = await window.go.main.App.GetCV(cvId);
        visualEditorCurrentCV = cv;
        console.log('[Builder] CV loaded:', cv);

        // Apply color scheme and template
        currentColorScheme = cv.color_scheme || 'blue';
        currentTemplate = cv.template || 'modern';

        // Update toolbar buttons - pills and swatches
        document.querySelectorAll('.color-swatch').forEach(s => {
            s.classList.toggle('active', s.dataset.color === currentColorScheme);
        });
        document.querySelectorAll('.template-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.template === currentTemplate);
        });

        // Apply to CV canvas
        if (cvCanvas) {
            cvCanvas.setAttribute('data-color', currentColorScheme);
            cvCanvas.setAttribute('data-template', currentTemplate);
        }

        // Populate header with live-edit fields
        const nameEl = document.querySelector('.cv-name.live-edit');
        const jobTitleEl = document.querySelector('.cv-title.live-edit');

        if (nameEl) {
            nameEl.textContent = `${cv.firstname || ''} ${cv.lastname || ''}`.trim();
            nameEl.setAttribute('contenteditable', 'true');
        }
        if (jobTitleEl) {
            jobTitleEl.textContent = cv.job_title || '';
            jobTitleEl.setAttribute('contenteditable', 'true');
        }

        // Contact chips with live-edit spans
        const emailSpan = document.querySelector('.contact-chip[data-field="email"] .live-edit');
        const phoneSpan = document.querySelector('.contact-chip[data-field="phone"] .live-edit');
        const locationSpan = document.querySelector('.contact-chip[data-field="location"] .live-edit');

        if (emailSpan) {
            emailSpan.textContent = cv.email || '';
            emailSpan.setAttribute('contenteditable', 'true');
        }
        if (phoneSpan) {
            phoneSpan.textContent = cv.phone || '';
            phoneSpan.setAttribute('contenteditable', 'true');
        }
        if (locationSpan) {
            locationSpan.textContent = cv.address || '';
            locationSpan.setAttribute('contenteditable', 'true');
        }

        // Summary
        const summaryEl = document.querySelector('.summary-text.live-edit');
        if (summaryEl) {
            summaryEl.textContent = cv.summary || '';
            summaryEl.setAttribute('contenteditable', 'true');
        }

        // Photo
        const photoImg = document.getElementById('photoImg');
        const photoPlaceholder = document.getElementById('photoPlaceholder');
        const photoRemoveBtn = document.getElementById('photoRemoveBtn');

        if (cv.photo_path && photoImg && photoPlaceholder) {
            photoImg.src = `file:///${cv.photo_path.replace(/\\/g, '/')}`;
            photoImg.style.display = 'block';
            photoPlaceholder.style.display = 'none';
            if (photoRemoveBtn) photoRemoveBtn.style.display = 'block';
        } else if (photoImg && photoPlaceholder) {
            photoImg.style.display = 'none';
            photoPlaceholder.style.display = 'flex';
            if (photoRemoveBtn) photoRemoveBtn.style.display = 'none';
        }

        // Render all sections
        renderExperienceList(cv.work_experience || []);
        renderEducationList(cv.education || []);
        renderSkillsList(cv.skills || []);
        renderLanguagesList(cv.languages || []);

        // Update section navigator
        updateSectionNavigator(cv);

        // Show content
        if (loadingEl) loadingEl.style.display = 'none';
        if (documentEl) documentEl.style.display = 'block';

        // Show autosave indicator
        showAutoSaveIndicator('Geladen');

    } catch (error) {
        console.error('[Builder] Failed to load CV:', error);
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div class="loading-animation" style="color: #ef4444;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </div>
                <p style="color: #ef4444;">Fehler beim Laden</p>
                <p style="color: #888; font-size: 12px; margin-top: 8px;">${error.message}</p>
            `;
        }
    }
}

function refreshCVDisplay() {
    if (!visualEditorCurrentCV) return;

    const cv = visualEditorCurrentCV;

    // Update header fields
    const nameEl = document.querySelector('.cv-name.live-edit');
    const jobTitleEl = document.querySelector('.cv-title.live-edit');

    if (nameEl) nameEl.textContent = `${cv.firstname || ''} ${cv.lastname || ''}`.trim();
    if (jobTitleEl) jobTitleEl.textContent = cv.job_title || '';

    const emailSpan = document.querySelector('.contact-chip[data-field="email"] .live-edit');
    const phoneSpan = document.querySelector('.contact-chip[data-field="phone"] .live-edit');
    const locationSpan = document.querySelector('.contact-chip[data-field="location"] .live-edit');

    if (emailSpan) emailSpan.textContent = cv.email || '';
    if (phoneSpan) phoneSpan.textContent = cv.phone || '';
    if (locationSpan) locationSpan.textContent = cv.address || '';

    const summaryEl = document.querySelector('.summary-text.live-edit');
    if (summaryEl) summaryEl.textContent = cv.summary || '';

    renderExperienceList(cv.work_experience || []);
    renderEducationList(cv.education || []);
    renderSkillsList(cv.skills || []);
    renderLanguagesList(cv.languages || []);
    updateSectionNavigator(cv);
}

function updateSectionNavigator(cv) {
    const container = document.getElementById('navSections');
    if (!container) return;

    const sections = [
        { id: 'header', name: 'Kopfzeile', icon: 'user', count: '' },
        { id: 'summary', name: 'Profil', icon: 'file-text', count: '' },
        { id: 'experience', name: 'Berufserfahrung', icon: 'briefcase', count: (cv.work_experience?.length || 0) + ' Einträge' },
        { id: 'education', name: 'Ausbildung', icon: 'graduation-cap', count: (cv.education?.length || 0) + ' Einträge' },
        { id: 'skills', name: 'Fähigkeiten', icon: 'star', count: (cv.skills?.length || 0) + ' Skills' },
        { id: 'languages', name: 'Sprachen', icon: 'globe', count: (cv.languages?.length || 0) + ' Sprachen' }
    ];

    const iconMap = {
        'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
        'briefcase': '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
        'graduation-cap': '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
        'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        'globe': '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
    };

    container.innerHTML = sections.map(sec => `
        <div class="nav-section-item" data-section="${sec.id}" draggable="${sec.id !== 'header'}">
            <div class="drag-handle" style="${sec.id === 'header' ? 'visibility:hidden' : ''}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
                    <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
                </svg>
            </div>
            <div class="nav-section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${iconMap[sec.icon] || ''}
                </svg>
            </div>
            <div class="nav-section-info">
                <div class="nav-section-name">${sec.name}</div>
                ${sec.count ? `<div class="nav-section-count">${sec.count}</div>` : ''}
            </div>
            <button class="nav-section-toggle" onclick="toggleSectionVisibility('${sec.id}')" title="Ein-/Ausblenden">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
            </button>
        </div>
    `).join('');

    // Add click handlers for navigation
    container.querySelectorAll('.nav-section-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.drag-handle') || e.target.closest('.nav-section-toggle')) return;
            scrollToSection(item.dataset.section);
            container.querySelectorAll('.nav-section-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function toggleSectionVisibility(sectionId) {
    const section = document.querySelector(`.cv-sec[data-section="${sectionId}"]`);
    const navItem = document.querySelector(`.nav-section-item[data-section="${sectionId}"]`);

    if (section) {
        section.classList.toggle('hidden-section');
    }
    if (navItem) {
        navItem.classList.toggle('hidden');
    }
}

window.toggleSectionVisibility = toggleSectionVisibility;

function renderExperienceList(experiences) {
    const container = document.getElementById('experienceItems');
    if (!container) return;

    if (experiences.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = experiences.map((exp, idx) => `
        <div class="timeline-item" data-index="${idx}" draggable="true">
            <div class="item-actions">
                <button class="item-action-btn" onclick="editExperienceItem(${idx})" title="Bearbeiten">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="item-action-btn delete" onclick="deleteExperienceItem(${idx})" title="Löschen">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
            <div class="item-header">
                <h4 class="item-title">${exp.position || 'Position'}</h4>
                <span class="item-date">${exp.start_date || ''} - ${exp.end_date || 'heute'}</span>
            </div>
            <p class="item-subtitle">${exp.company || 'Unternehmen'}${exp.location ? ', ' + exp.location : ''}</p>
            ${exp.description ? `<p class="item-description">${exp.description}</p>` : ''}
            ${exp.tasks && exp.tasks.length > 0 ? `
                <ul class="item-tasks">
                    ${exp.tasks.map(task => `<li>${task}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('');
}

function renderEducationList(education) {
    const container = document.getElementById('educationItems');
    if (!container) return;

    if (education.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = education.map((edu, idx) => `
        <div class="timeline-item" data-index="${idx}" draggable="true">
            <div class="item-actions">
                <button class="item-action-btn" onclick="editEducationItem(${idx})" title="Bearbeiten">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="item-action-btn delete" onclick="deleteEducationItem(${idx})" title="Löschen">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
            <div class="item-header">
                <h4 class="item-title">${edu.degree || 'Abschluss'}</h4>
                <span class="item-date">${edu.start_date || ''} - ${edu.end_date || ''}</span>
            </div>
            <p class="item-subtitle">${edu.institution || 'Institution'}${edu.location ? ', ' + edu.location : ''}</p>
            ${edu.description ? `<p class="item-description">${edu.description}</p>` : ''}
        </div>
    `).join('');
}

function renderSkillsList(skills) {
    const container = document.getElementById('skillsCloud');
    if (!container) return;

    if (skills.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = skills.map((skill, idx) => {
        const level = skill.level || 3;
        const dots = Array(5).fill(0).map((_, i) =>
            `<span class="skill-dot ${i < level ? 'filled' : ''}"></span>`
        ).join('');

        return `
            <div class="skill-tag" data-index="${idx}" onclick="editSkillItem(${idx})" draggable="true">
                <span>${skill.name || 'Skill'}</span>
                <span class="skill-level">${dots}</span>
                <button class="remove-skill" onclick="event.stopPropagation(); deleteSkillItem(${idx})">×</button>
            </div>
        `;
    }).join('');
}

function renderLanguagesList(languages) {
    const container = document.getElementById('languagesGrid');
    if (!container) return;

    if (languages.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = languages.map((lang, idx) => {
        const level = lang.level || 3;
        const bars = Array(5).fill(0).map((_, i) =>
            `<span class="level-bar ${i < level ? 'filled' : ''}"></span>`
        ).join('');

        return `
            <div class="language-item" data-index="${idx}" onclick="editLanguageItem(${idx})" draggable="true">
                <div class="item-actions">
                    <button class="item-action-btn delete" onclick="event.stopPropagation(); deleteLanguageItem(${idx})" title="Löschen">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
                <span class="language-name">${lang.name || 'Sprache'}</span>
                <div class="language-level">${bars}</div>
            </div>
        `;
    }).join('');
}

// Legacy function for backwards compatibility
function updateSectionSidebar(cv) {
    // Now handled by updateSectionNavigator
    updateSectionNavigator(cv);
}

function scrollToSection(sectionId) {
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Highlight section briefly
        section.classList.add('highlight');
        setTimeout(() => section.classList.remove('highlight'), 1000);
    }
}

function applyColorScheme(color) {
    const cvCanvas = document.getElementById('cvCanvas');
    if (cvCanvas) {
        cvCanvas.setAttribute('data-color', color);
    }

    // Update active state in color options
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.color === color);
    });

    currentColorScheme = color;
    triggerAutoSave();
}

function applyTemplate(template) {
    const cvCanvas = document.getElementById('cvCanvas');
    if (cvCanvas) {
        cvCanvas.setAttribute('data-template', template);
    }

    // Update active state in template options
    document.querySelectorAll('.template-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.template === template);
    });

    // Update dropdown trigger text
    const templateName = document.getElementById('templateName');
    const activeOption = document.querySelector(`.template-option[data-template="${template}"]`);
    if (templateName && activeOption) {
        const nameEl = activeOption.querySelector('.template-name');
        if (nameEl) {
            templateName.textContent = nameEl.textContent;
        }
    }

    currentTemplate = template;
    triggerAutoSave();
}

// Skills display style functions
function applySkillsDisplayStyle(style) {
    const skillsSection = document.querySelector('.cv-sec[data-section="skills"], .cv-section[data-section="skills"]');
    if (!skillsSection) return;

    const skillsContainer = skillsSection.querySelector('.skills-container, .skills-cloud');
    if (skillsContainer) {
        skillsContainer.setAttribute('data-display', style);
    }

    // Re-render skills based on style
    renderSkillsWithStyle(style);
}

function renderSkillsWithStyle(style) {
    const skillsCloud = document.getElementById('skillsCloud') || document.querySelector('.skills-cloud');
    if (!skillsCloud) return;

    // Get skills from current CV or from existing elements
    let skills = [];
    if (visualEditorCurrentCV?.skills) {
        skills = visualEditorCurrentCV.skills;
    } else {
        // Try to get skills from existing skill tags
        const existingTags = skillsCloud.querySelectorAll('.skill-tag, .skill-item');
        existingTags.forEach(tag => {
            const name = tag.textContent.trim().replace('×', '').trim();
            if (name) skills.push({ name, level: 80 });
        });
    }

    if (skills.length === 0) return;

    skillsCloud.innerHTML = '';

    skills.forEach(skill => {
        const skillEl = document.createElement('div');
        skillEl.className = 'skill-item';

        switch (style) {
            case 'tags':
                skillEl.className = 'skill-tag';
                skillEl.innerHTML = `<span class="skill-name">${skill.name}</span>`;
                break;

            case 'bars':
                const level = skill.level || 80;
                skillEl.innerHTML = `
                    <div class="skill-header">
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-level">${level}%</span>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-bar-fill" style="width: ${level}%"></div>
                    </div>
                `;
                break;

            case 'dots':
                const dotLevel = Math.round((skill.level || 80) / 20);
                let dots = '';
                for (let i = 1; i <= 5; i++) {
                    dots += `<span class="skill-dot ${i <= dotLevel ? 'filled' : ''}"></span>`;
                }
                skillEl.innerHTML = `
                    <span class="skill-name">${skill.name}</span>
                    <div class="skill-dots">${dots}</div>
                `;
                break;

            case 'percentage':
                const pctLevel = skill.level || 80;
                skillEl.innerHTML = `
                    <div class="skill-circle" style="--percentage: ${pctLevel}">
                        <svg viewBox="0 0 36 36">
                            <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            <path class="circle-fill" stroke-dasharray="${pctLevel}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                        </svg>
                        <span class="skill-pct">${pctLevel}%</span>
                    </div>
                    <span class="skill-name">${skill.name}</span>
                `;
                break;

            case 'list':
                skillEl.innerHTML = `
                    <span class="skill-bullet">•</span>
                    <span class="skill-name">${skill.name}</span>
                `;
                break;
        }

        skillsCloud.appendChild(skillEl);
    });

    // Update container class
    skillsCloud.className = `skills-cloud skills-${style}`;
}

// Languages display style functions
function applyLanguagesDisplayStyle(style) {
    const langSection = document.querySelector('.cv-sec[data-section="languages"], .cv-section[data-section="languages"]');
    if (!langSection) return;

    const langContainer = langSection.querySelector('.languages-container, .languages-grid');
    if (langContainer) {
        langContainer.setAttribute('data-display', style);
    }

    // Re-render languages based on style
    renderLanguagesWithStyle(style);
}

function renderLanguagesWithStyle(style) {
    const langGrid = document.getElementById('languagesGrid') || document.querySelector('.languages-grid');
    if (!langGrid) return;

    // Get languages from current CV or from existing elements
    let languages = [];
    if (visualEditorCurrentCV?.languages) {
        languages = visualEditorCurrentCV.languages;
    } else {
        // Try to get languages from existing elements
        const existingLangs = langGrid.querySelectorAll('.lang-item, .language-item');
        existingLangs.forEach(lang => {
            const nameEl = lang.querySelector('.lang-name, .language-name');
            const name = nameEl ? nameEl.textContent.trim() : lang.textContent.trim();
            if (name) languages.push({ name, level: 80, proficiency: 'Fließend' });
        });
    }

    if (languages.length === 0) return;

    langGrid.innerHTML = '';

    const levelNames = {
        100: 'Muttersprache',
        90: 'Verhandlungssicher (C2)',
        80: 'Fließend (C1)',
        70: 'Fortgeschritten (B2)',
        60: 'Gute Kenntnisse (B1)',
        50: 'Grundkenntnisse (A2)',
        30: 'Anfänger (A1)'
    };

    const flagEmojis = {
        'Deutsch': '🇩🇪',
        'Englisch': '🇬🇧',
        'Französisch': '🇫🇷',
        'Spanisch': '🇪🇸',
        'Italienisch': '🇮🇹',
        'Portugiesisch': '🇵🇹',
        'Russisch': '🇷🇺',
        'Chinesisch': '🇨🇳',
        'Japanisch': '🇯🇵',
        'Koreanisch': '🇰🇷',
        'Arabisch': '🇸🇦',
        'Türkisch': '🇹🇷',
        'Polnisch': '🇵🇱',
        'Niederländisch': '🇳🇱',
        'Schwedisch': '🇸🇪'
    };

    languages.forEach(lang => {
        const langEl = document.createElement('div');
        langEl.className = 'lang-item';
        const level = lang.level || 80;
        const levelText = levelNames[level] || lang.proficiency || `${level}%`;

        switch (style) {
            case 'bars':
                langEl.innerHTML = `
                    <div class="lang-header">
                        <span class="lang-name">${lang.name}</span>
                        <span class="lang-level">${levelText}</span>
                    </div>
                    <div class="lang-bar">
                        <div class="lang-bar-fill" style="width: ${level}%"></div>
                    </div>
                `;
                break;

            case 'circles':
                const circleLevel = Math.round(level / 20);
                let circles = '';
                for (let i = 1; i <= 5; i++) {
                    circles += `<span class="lang-circle ${i <= circleLevel ? 'filled' : ''}"></span>`;
                }
                langEl.innerHTML = `
                    <span class="lang-name">${lang.name}</span>
                    <div class="lang-circles">${circles}</div>
                    <span class="lang-level-text">${levelText}</span>
                `;
                break;

            case 'text':
                langEl.innerHTML = `
                    <span class="lang-name">${lang.name}</span>
                    <span class="lang-separator">—</span>
                    <span class="lang-level-text">${levelText}</span>
                `;
                break;

            case 'flags':
                const flag = flagEmojis[lang.name] || '🌐';
                langEl.innerHTML = `
                    <span class="lang-flag">${flag}</span>
                    <span class="lang-name">${lang.name}</span>
                    <span class="lang-level-text">${levelText}</span>
                `;
                break;
        }

        langGrid.appendChild(langEl);
    });

    // Update container class
    langGrid.className = `languages-grid lang-${style}`;
}

// Section settings
function openSectionSettings(sectionId) {
    const section = document.querySelector(`#${sectionId}, .cv-sec[data-section="${sectionId}"], .cv-section[data-section="${sectionId}"]`);
    if (!section) return;

    // Create modal if it doesn't exist
    let modal = document.getElementById('sectionSettingsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sectionSettingsModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content section-settings-modal">
                <div class="modal-header">
                    <h3>Abschnitt-Einstellungen</h3>
                    <button class="modal-close" onclick="closeSectionSettings()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-group">
                        <label>Abschnitt-Titel</label>
                        <input type="text" id="sectionTitleInput" placeholder="Titel eingeben">
                    </div>
                    <div class="settings-group">
                        <label>Icon</label>
                        <div class="icon-selector" id="iconSelector">
                            <button class="icon-option" data-icon="briefcase" title="Koffer">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                            </button>
                            <button class="icon-option" data-icon="graduation" title="Bildung">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                            </button>
                            <button class="icon-option" data-icon="star" title="Stern">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            </button>
                            <button class="icon-option" data-icon="globe" title="Sprachen">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            </button>
                            <button class="icon-option" data-icon="award" title="Zertifikate">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                            </button>
                            <button class="icon-option" data-icon="heart" title="Hobbys">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            </button>
                            <button class="icon-option" data-icon="none" title="Kein Icon">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="settings-group">
                        <label>Sichtbarkeit</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="sectionVisibleToggle" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Sichtbar</span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeSectionSettings()">Abbrechen</button>
                    <button class="btn-primary" onclick="saveSectionSettings()">Speichern</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Store current section ID
    modal.dataset.sectionId = sectionId;

    // Populate current values
    const titleEl = section.querySelector('.sec-title-text');
    const titleInput = document.getElementById('sectionTitleInput');
    if (titleEl && titleInput) {
        titleInput.value = titleEl.textContent.trim();
    }

    // Set current icon
    const iconEl = section.querySelector('.sec-icon');
    if (iconEl) {
        const currentIcon = iconEl.dataset.icon || 'briefcase';
        document.querySelectorAll('#iconSelector .icon-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.icon === currentIcon);
        });
    }

    // Setup icon selection
    document.querySelectorAll('#iconSelector .icon-option').forEach(opt => {
        opt.onclick = () => {
            document.querySelectorAll('#iconSelector .icon-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        };
    });

    // Set visibility toggle
    const visibleToggle = document.getElementById('sectionVisibleToggle');
    if (visibleToggle) {
        visibleToggle.checked = !section.classList.contains('hidden');
    }

    // Show modal
    modal.classList.add('active');
}

function closeSectionSettings() {
    const modal = document.getElementById('sectionSettingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function saveSectionSettings() {
    const modal = document.getElementById('sectionSettingsModal');
    if (!modal) return;

    const sectionId = modal.dataset.sectionId;
    const section = document.querySelector(`#${sectionId}, .cv-sec[data-section="${sectionId}"], .cv-section[data-section="${sectionId}"]`);
    if (!section) return;

    // Update title
    const titleInput = document.getElementById('sectionTitleInput');
    const titleEl = section.querySelector('.sec-title-text');
    if (titleInput && titleEl) {
        titleEl.textContent = titleInput.value;
    }

    // Update icon
    const activeIcon = document.querySelector('#iconSelector .icon-option.active');
    const iconEl = section.querySelector('.sec-icon');
    if (activeIcon && iconEl) {
        const iconType = activeIcon.dataset.icon;
        iconEl.dataset.icon = iconType;

        if (iconType === 'none') {
            iconEl.style.display = 'none';
        } else {
            iconEl.style.display = '';
            iconEl.innerHTML = activeIcon.innerHTML;
        }
    }

    // Update visibility
    const visibleToggle = document.getElementById('sectionVisibleToggle');
    if (visibleToggle) {
        section.classList.toggle('hidden', !visibleToggle.checked);
    }

    closeSectionSettings();
    triggerAutoSave();
}

function updateBuilderZoom() {
    const cvCanvas = document.getElementById('cvCanvas');
    const zoomLevelEl = document.getElementById('zoomLevel');

    if (cvCanvas) {
        cvCanvas.style.transform = `scale(${visualEditorZoom / 100})`;
        cvCanvas.style.transformOrigin = 'top center';
    }

    if (zoomLevelEl) {
        zoomLevelEl.textContent = visualEditorZoom + '%';
    }
}

function setupInlineEditing() {
    // Setup editable fields
    document.querySelectorAll('.editable').forEach(el => {
        el.addEventListener('blur', () => {
            const field = el.dataset.field;
            const value = el.textContent.trim();
            updateCVField(field, value);
        });

        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                el.blur();
            }
        });
    });
}

function updateCVField(field, value) {
    if (!visualEditorCurrentCV) return;

    switch (field) {
        case 'fullname':
            const parts = value.split(' ');
            visualEditorCurrentCV.firstname = parts[0] || '';
            visualEditorCurrentCV.lastname = parts.slice(1).join(' ') || '';
            break;
        case 'job_title':
            visualEditorCurrentCV.job_title = value;
            break;
        case 'email':
            visualEditorCurrentCV.email = value;
            break;
        case 'phone':
            visualEditorCurrentCV.phone = value;
            break;
        case 'location':
            visualEditorCurrentCV.address = value;
            break;
        case 'summary':
            visualEditorCurrentCV.summary = value;
            break;
    }

    triggerAutoSave();
}

function triggerAutoSave() {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }

    showAutoSaveIndicator('Speichert...', true);

    autoSaveTimeout = setTimeout(async () => {
        await saveCurrentCVChanges();
    }, 1000);
}

async function saveCurrentCVChanges() {
    if (!visualEditorCurrentCV) return;

    try {
        // Update template and color scheme
        visualEditorCurrentCV.template = currentTemplate;
        visualEditorCurrentCV.color_scheme = currentColorScheme;

        await window.go.main.App.SaveCV(visualEditorCurrentCV);
        console.log('[Builder] CV saved successfully');
        showAutoSaveIndicator('Gespeichert');
    } catch (error) {
        console.error('[Builder] Save failed:', error);
        showAutoSaveIndicator('Fehler!', false, true);
    }
}

function showAutoSaveIndicator(text, saving = false, error = false) {
    const indicator = document.getElementById('autosaveIndicator');
    if (!indicator) return;

    indicator.textContent = text;
    indicator.classList.toggle('saving', saving);
    indicator.classList.toggle('error', error);
    indicator.classList.add('visible');

    if (!saving) {
        setTimeout(() => {
            indicator.classList.remove('visible');
        }, 2000);
    }
}

// Add/Edit/Delete functions for items
async function addExperienceItem() {
    if (!visualEditorCurrentCV) return;

    const newExp = {
        id: Date.now().toString(),
        position: 'Neue Position',
        company: 'Unternehmen',
        location: '',
        start_date: '',
        end_date: '',
        tasks: []
    };

    if (!visualEditorCurrentCV.work_experience) {
        visualEditorCurrentCV.work_experience = [];
    }

    visualEditorCurrentCV.work_experience.push(newExp);
    renderExperienceList(visualEditorCurrentCV.work_experience);
    updateSectionSidebar(visualEditorCurrentCV);
    triggerAutoSave();

    // Open edit dialog
    editExperienceItem(visualEditorCurrentCV.work_experience.length - 1);
}

async function addEducationItem() {
    if (!visualEditorCurrentCV) return;

    const newEdu = {
        id: Date.now().toString(),
        degree: 'Neuer Abschluss',
        institution: 'Institution',
        location: '',
        start_date: '',
        end_date: '',
        description: ''
    };

    if (!visualEditorCurrentCV.education) {
        visualEditorCurrentCV.education = [];
    }

    visualEditorCurrentCV.education.push(newEdu);
    renderEducationList(visualEditorCurrentCV.education);
    updateSectionSidebar(visualEditorCurrentCV);
    triggerAutoSave();

    editEducationItem(visualEditorCurrentCV.education.length - 1);
}

async function addSkillItem() {
    if (!visualEditorCurrentCV) return;
    showSkillEditModal(-1); // -1 = new skill
}

async function addLanguageItem() {
    if (!visualEditorCurrentCV) return;
    showLanguageEditModal(-1); // -1 = new language
}

// Skill Edit Modal
function showSkillEditModal(idx) {
    const isNew = idx === -1;
    const skill = isNew ? { name: '', level: 3 } : visualEditorCurrentCV.skills[idx];

    let modal = document.getElementById('skillEditModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'skillEditModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content item-edit-modal">
            <div class="modal-header">
                <h3>${isNew ? 'Skill hinzufügen' : 'Skill bearbeiten'}</h3>
                <button class="modal-close" onclick="closeSkillEditModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Skill-Name</label>
                    <input type="text" id="skillNameInput" value="${skill.name}" placeholder="z.B. JavaScript, Projektmanagement">
                </div>
                <div class="form-group">
                    <label>Level (1-5)</label>
                    <div class="level-selector">
                        ${[1,2,3,4,5].map(l => `
                            <button class="level-btn ${l <= skill.level ? 'active' : ''}" data-level="${l}" onclick="setSkillLevel(${l})">
                                <span class="level-dot"></span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="level-labels">
                        <span>Grundkenntnisse</span>
                        <span>Experte</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeSkillEditModal()">Abbrechen</button>
                <button class="btn-primary" onclick="saveSkillEdit(${idx})">Speichern</button>
            </div>
        </div>
    `;

    modal.dataset.skillLevel = skill.level;
    modal.classList.add('active');

    // Focus input
    setTimeout(() => document.getElementById('skillNameInput')?.focus(), 100);
}

function setSkillLevel(level) {
    const modal = document.getElementById('skillEditModal');
    if (modal) {
        modal.dataset.skillLevel = level;
        modal.querySelectorAll('.level-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i < level);
        });
    }
}

function closeSkillEditModal() {
    const modal = document.getElementById('skillEditModal');
    if (modal) modal.classList.remove('active');
}

function saveSkillEdit(idx) {
    const modal = document.getElementById('skillEditModal');
    const nameInput = document.getElementById('skillNameInput');
    if (!modal || !nameInput) return;

    const name = nameInput.value.trim();
    if (!name) {
        nameInput.focus();
        return;
    }

    const level = parseInt(modal.dataset.skillLevel) || 3;
    const isNew = idx === -1;

    if (!visualEditorCurrentCV.skills) {
        visualEditorCurrentCV.skills = [];
    }

    if (isNew) {
        visualEditorCurrentCV.skills.push({ name, level });
    } else {
        visualEditorCurrentCV.skills[idx] = { name, level };
    }

    renderSkillsList(visualEditorCurrentCV.skills);
    updateSectionSidebar(visualEditorCurrentCV);
    closeSkillEditModal();
    triggerAutoSave();
}

// Language Edit Modal
function showLanguageEditModal(idx) {
    const isNew = idx === -1;
    const lang = isNew ? { name: '', level: 3, proficiency: '' } : visualEditorCurrentCV.languages[idx];

    const proficiencyLevels = [
        { value: 1, label: 'Anfänger (A1)' },
        { value: 2, label: 'Grundkenntnisse (A2)' },
        { value: 3, label: 'Gute Kenntnisse (B1)' },
        { value: 4, label: 'Fließend (B2/C1)' },
        { value: 5, label: 'Muttersprache (C2)' }
    ];

    let modal = document.getElementById('languageEditModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'languageEditModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content item-edit-modal">
            <div class="modal-header">
                <h3>${isNew ? 'Sprache hinzufügen' : 'Sprache bearbeiten'}</h3>
                <button class="modal-close" onclick="closeLanguageEditModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Sprache</label>
                    <input type="text" id="langNameInput" value="${lang.name}" placeholder="z.B. Englisch, Französisch" list="languageSuggestions">
                    <datalist id="languageSuggestions">
                        <option value="Deutsch">
                        <option value="Englisch">
                        <option value="Französisch">
                        <option value="Spanisch">
                        <option value="Italienisch">
                        <option value="Portugiesisch">
                        <option value="Russisch">
                        <option value="Chinesisch">
                        <option value="Japanisch">
                        <option value="Arabisch">
                        <option value="Türkisch">
                        <option value="Polnisch">
                        <option value="Niederländisch">
                    </datalist>
                </div>
                <div class="form-group">
                    <label>Sprachniveau</label>
                    <div class="proficiency-selector">
                        ${proficiencyLevels.map(p => `
                            <label class="proficiency-option ${p.value === lang.level ? 'selected' : ''}">
                                <input type="radio" name="proficiency" value="${p.value}" ${p.value === lang.level ? 'checked' : ''}>
                                <span class="proficiency-label">${p.label}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeLanguageEditModal()">Abbrechen</button>
                <button class="btn-primary" onclick="saveLanguageEdit(${idx})">Speichern</button>
            </div>
        </div>
    `;

    modal.classList.add('active');

    // Add radio change handlers
    modal.querySelectorAll('input[name="proficiency"]').forEach(radio => {
        radio.addEventListener('change', () => {
            modal.querySelectorAll('.proficiency-option').forEach(opt => opt.classList.remove('selected'));
            radio.closest('.proficiency-option').classList.add('selected');
        });
    });

    // Focus input
    setTimeout(() => document.getElementById('langNameInput')?.focus(), 100);
}

function closeLanguageEditModal() {
    const modal = document.getElementById('languageEditModal');
    if (modal) modal.classList.remove('active');
}

function saveLanguageEdit(idx) {
    const modal = document.getElementById('languageEditModal');
    const nameInput = document.getElementById('langNameInput');
    if (!modal || !nameInput) return;

    const name = nameInput.value.trim();
    if (!name) {
        nameInput.focus();
        return;
    }

    const selectedRadio = modal.querySelector('input[name="proficiency"]:checked');
    const level = selectedRadio ? parseInt(selectedRadio.value) : 3;
    const isNew = idx === -1;

    if (!visualEditorCurrentCV.languages) {
        visualEditorCurrentCV.languages = [];
    }

    const proficiencyLabels = {
        1: 'Anfänger (A1)',
        2: 'Grundkenntnisse (A2)',
        3: 'Gute Kenntnisse (B1)',
        4: 'Fließend (B2/C1)',
        5: 'Muttersprache (C2)'
    };

    if (isNew) {
        visualEditorCurrentCV.languages.push({ name, level, proficiency: proficiencyLabels[level] });
    } else {
        visualEditorCurrentCV.languages[idx] = { name, level, proficiency: proficiencyLabels[level] };
    }

    renderLanguagesList(visualEditorCurrentCV.languages);
    updateSectionSidebar(visualEditorCurrentCV);
    closeLanguageEditModal();
    triggerAutoSave();
}

function editExperienceItem(idx) {
    showExperienceEditDialog(idx);
}

function editEducationItem(idx) {
    showEducationEditDialog(idx);
}

function editSkillItem(idx) {
    showSkillEditModal(idx);
}

function deleteExperienceItem(idx) {
    if (!confirm('Position wirklich löschen?')) return;
    visualEditorCurrentCV.work_experience.splice(idx, 1);
    renderExperienceList(visualEditorCurrentCV.work_experience);
    updateSectionSidebar(visualEditorCurrentCV);
    triggerAutoSave();
}

function deleteEducationItem(idx) {
    if (!confirm('Ausbildung wirklich löschen?')) return;
    visualEditorCurrentCV.education.splice(idx, 1);
    renderEducationList(visualEditorCurrentCV.education);
    updateSectionSidebar(visualEditorCurrentCV);
    triggerAutoSave();
}

function deleteSkillItem(idx) {
    visualEditorCurrentCV.skills.splice(idx, 1);
    renderSkillsList(visualEditorCurrentCV.skills);
    updateSectionSidebar(visualEditorCurrentCV);
    triggerAutoSave();
}

function editLanguageItem(idx) {
    showLanguageEditModal(idx);
}

function deleteLanguageItem(idx) {
    visualEditorCurrentCV.languages.splice(idx, 1);
    renderLanguagesList(visualEditorCurrentCV.languages);
    updateSectionSidebar(visualEditorCurrentCV);
    triggerAutoSave();
}

function showExperienceEditDialog(idx) {
    const exp = visualEditorCurrentCV.work_experience[idx];

    const panel = document.getElementById('propertiesPanelContent');
    if (!panel) return;

    panel.innerHTML = `
        <div class="property-group">
            <div class="property-label">Position</div>
            <input type="text" class="property-input" id="expPosition" value="${exp.position || ''}">
        </div>
        <div class="property-group">
            <div class="property-label">Unternehmen</div>
            <input type="text" class="property-input" id="expCompany" value="${exp.company || ''}">
        </div>
        <div class="property-group">
            <div class="property-label">Ort</div>
            <input type="text" class="property-input" id="expLocation" value="${exp.location || ''}">
        </div>
        <div class="property-group">
            <div class="property-label">Zeitraum</div>
            <div style="display: flex; gap: 8px;">
                <input type="text" class="property-input" id="expStart" placeholder="Von" value="${exp.start_date || ''}">
                <input type="text" class="property-input" id="expEnd" placeholder="Bis" value="${exp.end_date || ''}">
            </div>
        </div>
        <div class="property-group">
            <div class="property-label">Aufgaben (eine pro Zeile)</div>
            <textarea class="property-input property-textarea" id="expTasks">${(exp.tasks || []).join('\n')}</textarea>
        </div>
        <button class="btn-primary btn-block" onclick="saveExperienceEdit(${idx})">Speichern</button>
    `;
}

function saveExperienceEdit(idx) {
    const exp = visualEditorCurrentCV.work_experience[idx];
    exp.position = document.getElementById('expPosition').value;
    exp.company = document.getElementById('expCompany').value;
    exp.location = document.getElementById('expLocation').value;
    exp.start_date = document.getElementById('expStart').value;
    exp.end_date = document.getElementById('expEnd').value;
    exp.tasks = document.getElementById('expTasks').value.split('\n').filter(t => t.trim());

    renderExperienceList(visualEditorCurrentCV.work_experience);
    closePropertiesPanel();
    triggerAutoSave();
}

function showEducationEditDialog(idx) {
    const edu = visualEditorCurrentCV.education[idx];

    const panel = document.getElementById('propertiesPanelContent');
    if (!panel) return;

    panel.innerHTML = `
        <div class="property-group">
            <div class="property-label">Abschluss</div>
            <input type="text" class="property-input" id="eduDegree" value="${edu.degree || ''}">
        </div>
        <div class="property-group">
            <div class="property-label">Institution</div>
            <input type="text" class="property-input" id="eduInstitution" value="${edu.institution || ''}">
        </div>
        <div class="property-group">
            <div class="property-label">Ort</div>
            <input type="text" class="property-input" id="eduLocation" value="${edu.location || ''}">
        </div>
        <div class="property-group">
            <div class="property-label">Zeitraum</div>
            <div style="display: flex; gap: 8px;">
                <input type="text" class="property-input" id="eduStart" placeholder="Von" value="${edu.start_date || ''}">
                <input type="text" class="property-input" id="eduEnd" placeholder="Bis" value="${edu.end_date || ''}">
            </div>
        </div>
        <div class="property-group">
            <div class="property-label">Beschreibung</div>
            <textarea class="property-input property-textarea" id="eduDescription">${edu.description || ''}</textarea>
        </div>
        <button class="btn-primary btn-block" onclick="saveEducationEdit(${idx})">Speichern</button>
    `;
}

function saveEducationEdit(idx) {
    const edu = visualEditorCurrentCV.education[idx];
    edu.degree = document.getElementById('eduDegree').value;
    edu.institution = document.getElementById('eduInstitution').value;
    edu.location = document.getElementById('eduLocation').value;
    edu.start_date = document.getElementById('eduStart').value;
    edu.end_date = document.getElementById('eduEnd').value;
    edu.description = document.getElementById('eduDescription').value;

    renderEducationList(visualEditorCurrentCV.education);
    closePropertiesPanel();
    triggerAutoSave();
}

function closePropertiesPanel() {
    const panel = document.getElementById('propertiesPanelContent');
    if (panel) {
        panel.innerHTML = `
            <div class="empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                </svg>
                <p>Klicke auf ein Element um es zu bearbeiten</p>
            </div>
        `;
    }
}

// Make functions globally available
window.addExperienceItem = addExperienceItem;
window.addEducationItem = addEducationItem;
window.addSkillItem = addSkillItem;
window.addLanguageItem = addLanguageItem;
window.editExperienceItem = editExperienceItem;
window.editEducationItem = editEducationItem;
window.editSkillItem = editSkillItem;
window.editLanguageItem = editLanguageItem;
window.deleteExperienceItem = deleteExperienceItem;
window.deleteEducationItem = deleteEducationItem;
window.deleteSkillItem = deleteSkillItem;
window.deleteLanguageItem = deleteLanguageItem;
window.saveExperienceEdit = saveExperienceEdit;
window.saveEducationEdit = saveEducationEdit;
window.closePropertiesPanel = closePropertiesPanel;
window.scrollToSection = scrollToSection;
window.showSkillEditModal = showSkillEditModal;
window.setSkillLevel = setSkillLevel;
window.closeSkillEditModal = closeSkillEditModal;
window.saveSkillEdit = saveSkillEdit;
window.showLanguageEditModal = showLanguageEditModal;
window.closeLanguageEditModal = closeLanguageEditModal;
window.saveLanguageEdit = saveLanguageEdit;

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
            const message = window.i18n ? window.i18n.t('confirmations.exit') : 'Möchtest du CV Manager wirklich beenden?';
            const confirmed = await showCustomConfirm('Beenden?', message, 'warning');
            if (confirmed) {
                window.runtime.Quit();
            }
        });
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


// ==================== GLOBAL KEYBOARD SHORTCUTS ====================
// Note: Visual Editor has its own keyboard shortcuts in setupKeyboardShortcuts()

function setupGlobalKeyboardShortcuts() {
    // Already set up in setupKeyboardShortcuts() for visual editor
    // This is for editor view only
    document.addEventListener('keydown', async (e) => {
        // Only apply to editor view
        const editorView = document.getElementById('editorView');
        if (!editorView || editorView.style.display === 'none') return;

        // Ctrl+S or Cmd+S: Save current CV
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (currentEditingCV) {
                await saveCurrentCV();
                await showSuccess('Gespeichert (Strg+S)');
            }
            return;
        }

        // Ctrl+P: Export/Print
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            if (currentEditingCV) {
                await exportCV(currentEditingCV.id);
            }
            return;
        }

        // Ctrl+D: Duplicate current CV
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            if (currentEditingCV) {
                await duplicateCV(currentEditingCV.id);
            }
            return;
        }
    });
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
                    showGlobalAutoSaveIndicator();
                } catch (error) {
                    console.error('Auto-save failed:', error);
                }
            }
        }
    }, AUTO_SAVE_INTERVAL);

    console.log('Auto-save enabled (every 30s)');
}

function showGlobalAutoSaveIndicator() {
    // Show a subtle "Saved" indicator for editor view
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


// ==================== Window Controls ====================
function setupWindowControls() {
    const minimizeBtn = document.getElementById('minimizeBtn');
    const maximizeBtn = document.getElementById('maximizeBtn');
    const closeBtn = document.getElementById('closeBtn');

    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            window.runtime.WindowMinimise();
        });
    }

    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            window.runtime.WindowToggleMaximise();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.runtime.Quit();
        });
    }
}

// Update footer version
async function updateFooterVersion() {
    try {
        const buildInfo = await window.go.main.App.GetBuildInfo();
        const footerVersion = document.getElementById('footerVersion');
        if (footerVersion) {
            footerVersion.textContent = `v${buildInfo.version}`;
        }
    } catch (error) {
        console.error('[Footer] Error loading version:', error);
    }
}

// Initialize window controls and footer
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupWindowControls();
        updateFooterVersion();
    });
} else {
    setupWindowControls();
    updateFooterVersion();
}


// ==================== Silent Auto-Update (Discord-style) ====================
let pendingUpdate = null;

async function checkForUpdates() {
    console.log('[Update] Silent update check starting...');
    
    try {
        const updateStatus = await window.go.main.App.CheckForUpdates();
        console.log('[Update] Status:', updateStatus);
        
        if (updateStatus.update_available) {
            console.log(`[Update] Found update: ${updateStatus.current_version} -> ${updateStatus.latest_version}`);
            
            // Automatically download in background
            await downloadUpdateSilently(updateStatus);
        } else {
            console.log('[Update] Already on latest version');
        }
    } catch (error) {
        console.error('[Update] Silent check failed:', error);
    }
}

async function downloadUpdateSilently(updateInfo) {
    console.log('[Update] Starting silent download...');
    
    try {
        const downloadResult = await window.go.main.App.DownloadUpdate(
            updateInfo.download_url,
            updateInfo.sha256 || ''
        );
        
        if (downloadResult.error) {
            console.error('[Update] Download failed:', downloadResult.error);
            return;
        }
        
        console.log('[Update] Download complete! Update will be installed on next start.');
        pendingUpdate = updateInfo;
        
        // Show small notification in footer
        showUpdateReadyNotification(updateInfo.latest_version);
        
    } catch (error) {
        console.error('[Update] Silent download error:', error);
    }
}

function showUpdateReadyNotification(version) {
    const footerVersion = document.getElementById('footerVersion');
    if (footerVersion) {
        footerVersion.innerHTML = `v${version} <span style="color: #10b981;">●</span>`;
        footerVersion.title = `Update auf v${version} bereit - wird beim nächsten Start installiert`;
    }
}

// Check on startup during splash screen
setTimeout(() => {
    console.log('[Update] Starting automatic update check during splash screen...');
    checkForUpdates();
}, 1000);

// Also allow manual check
document.addEventListener('DOMContentLoaded', () => {
    const checkBtn = document.getElementById('checkForUpdatesBtn');
    if (checkBtn) {
        checkBtn.addEventListener('click', async () => {
            checkBtn.disabled = true;
            checkBtn.textContent = 'Prüfe...';
            await checkForUpdates();
            checkBtn.disabled = false;
            checkBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Nach Updates suchen';
        });
    }
});

