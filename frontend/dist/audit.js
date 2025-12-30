// ========== Audit Log Management ==========

// Audit state
const auditState = {
    events: [],
    currentPage: 1,
    perPage: 50,
    filter: {
        startDate: null,
        endDate: null,
        eventType: '',
        category: '',
        status: ''
    }
};

// Initialize audit view
async function initAuditView() {
    console.log('[Audit] Initializing audit view...');

    try {
        // Load initial data
        await loadAuditStats();
        await loadAuditEvents();

        // Setup event listeners
        setupAuditListeners();

        console.log('[Audit] Initialization complete');
    } catch (error) {
        console.error('[Audit] Initialization failed:', error);
        showNotification('Failed to load audit data', 'error');
    }
}

// Load audit statistics
async function loadAuditStats() {
    try {
        const stats = await window.go.main.App.GetAuditStats();

        if (!stats) {
            console.warn('[Audit] No statistics available');
            return;
        }

        // Update stats cards
        document.getElementById('totalEvents').textContent = formatNumber(stats.total_events || 0);
        document.getElementById('todayEvents').textContent = formatNumber(stats.today_count || 0);
        document.getElementById('lastHourEvents').textContent = formatNumber(stats.last_hour_count || 0);
        document.getElementById('successRate').textContent = (stats.success_rate || 0).toFixed(1) + '%';

        console.log('[Audit] Statistics loaded:', stats);
    } catch (error) {
        console.error('[Audit] Failed to load statistics:', error);
        throw error;
    }
}

// Load audit events with current filter
async function loadAuditEvents() {
    try {
        // Build filter object
        const filter = buildAuditFilter();

        console.log('[Audit] Loading events with filter:', filter);

        // Fetch events from backend
        const events = await window.go.main.App.GetAuditEvents(filter);

        if (!events || events.length === 0) {
            console.log('[Audit] No events found');
            auditState.events = [];
            renderAuditEvents([]);
            return;
        }

        // Sort events by timestamp (newest first)
        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        auditState.events = events;
        auditState.currentPage = 1;

        renderAuditEvents(getCurrentPageEvents());
        updatePagination();

        console.log(`[Audit] Loaded ${events.length} events`);
    } catch (error) {
        console.error('[Audit] Failed to load events:', error);
        showNotification('Failed to load audit events', 'error');
    }
}

// Build audit filter from UI inputs
function buildAuditFilter() {
    const filter = {
        limit: 1000, // Get all events, paginate in frontend
        sort_by: 'timestamp',
        sort_order: 'desc'
    };

    // Date range
    const startDate = document.getElementById('auditStartDate').value;
    const endDate = document.getElementById('auditEndDate').value;

    if (startDate) {
        const date = new Date(startDate);
        date.setHours(0, 0, 0, 0);
        filter.start_date = date.toISOString();
        auditState.filter.startDate = date;
    }

    if (endDate) {
        const date = new Date(endDate);
        date.setHours(23, 59, 59, 999);
        filter.end_date = date.toISOString();
        auditState.filter.endDate = date;
    }

    // Event type
    const eventType = document.getElementById('auditEventTypeFilter').value;
    if (eventType) {
        filter.event_types = [eventType];
        auditState.filter.eventType = eventType;
    }

    // Category
    const category = document.getElementById('auditCategoryFilter').value;
    if (category) {
        filter.categories = [category];
        auditState.filter.category = category;
    }

    // Status
    const status = document.getElementById('auditStatusFilter').value;
    if (status === 'success') {
        filter.success_only = true;
    } else if (status === 'failure') {
        filter.failure_only = true;
    }
    auditState.filter.status = status;

    return filter;
}

// Get events for current page
function getCurrentPageEvents() {
    const start = (auditState.currentPage - 1) * auditState.perPage;
    const end = start + auditState.perPage;
    return auditState.events.slice(start, end);
}

// Render audit events
function renderAuditEvents(events) {
    const container = document.getElementById('auditEventsList');
    const emptyState = document.getElementById('auditEmptyState');
    const eventCount = document.getElementById('auditEventCount');

    // Update event count
    eventCount.textContent = auditState.events.length;

    // Clear container
    container.innerHTML = '';

    // Show empty state if no events
    if (!events || events.length === 0) {
        emptyState.style.display = 'flex';
        container.appendChild(emptyState);
        return;
    }

    emptyState.style.display = 'none';

    // Render each event
    events.forEach(event => {
        const eventCard = createAuditEventCard(event);
        container.appendChild(eventCard);
    });
}

// Create audit event card
function createAuditEventCard(event) {
    const card = document.createElement('div');
    card.className = 'audit-event-card';

    if (!event.success) {
        card.classList.add('event-failed');
    }

    const timestamp = new Date(event.timestamp);
    const timeAgo = formatRelativeTime(timestamp);

    // Event icon based on category
    const icon = getEventIcon(event.category, event.event_type);

    // Status badge
    const statusClass = event.success ? 'success' : 'error';
    const statusText = event.success ? 'Success' : 'Failed';

    card.innerHTML = `
        <div class="event-icon">${icon}</div>
        <div class="event-details">
            <div class="event-header">
                <div class="event-title">
                    <span class="event-type">${formatEventType(event.event_type)}</span>
                    <span class="event-badge badge-${event.category}">${event.category}</span>
                    <span class="status-badge status-${statusClass}">${statusText}</span>
                </div>
                <div class="event-time" title="${formatDateTime(timestamp)}">
                    ${timeAgo}
                </div>
            </div>

            ${event.resource_id ? `
                <div class="event-resource">
                    <span class="resource-label">${event.resource_type}:</span>
                    <span class="resource-id">${event.resource_id}</span>
                </div>
            ` : ''}

            ${event.error_message ? `
                <div class="event-error">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    ${event.error_message}
                </div>
            ` : ''}

            ${event.metadata && Object.keys(event.metadata).length > 0 ? `
                <div class="event-metadata">
                    ${Object.entries(event.metadata).map(([key, value]) => `
                        <span class="metadata-item">
                            <strong>${key}:</strong> ${value}
                        </span>
                    `).join('')}
                </div>
            ` : ''}

            ${event.changes && event.changes.fields && event.changes.fields.length > 0 ? `
                <div class="event-changes">
                    <strong>Changed fields:</strong>
                    ${event.changes.fields.map(field => `
                        <span class="changed-field">${field}</span>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;

    return card;
}

// Get event icon based on category and type
function getEventIcon(category, eventType) {
    const icons = {
        cv_management: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
        </svg>`,
        auth: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>`,
        settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6"></path>
        </svg>`,
        data_export: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>`,
        error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`
    };

    return icons[category] || icons.cv_management;
}

// Format event type for display
function formatEventType(eventType) {
    return eventType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(auditState.events.length / auditState.perPage);
    const pagination = document.getElementById('auditPagination');

    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';

    document.getElementById('auditCurrentPage').textContent = auditState.currentPage;
    document.getElementById('auditTotalPages').textContent = totalPages;

    // Disable/enable buttons
    document.getElementById('auditPrevBtn').disabled = auditState.currentPage === 1;
    document.getElementById('auditNextBtn').disabled = auditState.currentPage === totalPages;
}

// Setup event listeners
function setupAuditListeners() {
    // Apply filters button
    document.getElementById('auditApplyFiltersBtn').addEventListener('click', async () => {
        await loadAuditEvents();
        await loadAuditStats();
    });

    // Reset filters button
    document.getElementById('auditResetFiltersBtn').addEventListener('click', () => {
        document.getElementById('auditStartDate').value = '';
        document.getElementById('auditEndDate').value = '';
        document.getElementById('auditEventTypeFilter').value = '';
        document.getElementById('auditCategoryFilter').value = '';
        document.getElementById('auditStatusFilter').value = '';

        auditState.filter = {
            startDate: null,
            endDate: null,
            eventType: '',
            category: '',
            status: ''
        };

        loadAuditEvents();
        loadAuditStats();
    });

    // Export button
    document.getElementById('auditExportBtn').addEventListener('click', async () => {
        try {
            const filter = buildAuditFilter();
            const exportPath = await window.go.main.App.ExportAuditEvents(filter);

            showNotification(`Audit events exported to: ${exportPath}`, 'success');
            console.log('[Audit] Exported to:', exportPath);
        } catch (error) {
            console.error('[Audit] Export failed:', error);
            showNotification('Failed to export audit events', 'error');
        }
    });

    // Pagination buttons
    document.getElementById('auditPrevBtn').addEventListener('click', () => {
        if (auditState.currentPage > 1) {
            auditState.currentPage--;
            renderAuditEvents(getCurrentPageEvents());
            updatePagination();

            // Scroll to top
            document.getElementById('auditEventsList').scrollTop = 0;
        }
    });

    document.getElementById('auditNextBtn').addEventListener('click', () => {
        const totalPages = Math.ceil(auditState.events.length / auditState.perPage);
        if (auditState.currentPage < totalPages) {
            auditState.currentPage++;
            renderAuditEvents(getCurrentPageEvents());
            updatePagination();

            // Scroll to top
            document.getElementById('auditEventsList').scrollTop = 0;
        }
    });
}

// Helper: Format number with thousands separator
function formatNumber(num) {
    return new Intl.NumberFormat('de-DE').format(num);
}

// Helper: Format date and time
function formatDateTime(date) {
    return new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
}

// Export for use in main app
window.AuditManager = {
    init: initAuditView,
    loadEvents: loadAuditEvents,
    loadStats: loadAuditStats
};
