/**
 * CV Manager - Utility Functions
 * Robust error handling, formatting, and helper functions
 */

// ==================== Error Handling ====================

/**
 * Safely extract error message from any error type
 * @param {*} error - Error object, string, or any value
 * @param {string} fallback - Fallback message if error is empty
 * @returns {string} - Human-readable error message
 */
function getErrorMessage(error, fallback = 'Ein unbekannter Fehler ist aufgetreten') {
    if (!error) {
        return fallback;
    }

    // If error is a string, return it directly
    if (typeof error === 'string') {
        return error || fallback;
    }

    // If error is an Error object or has a message property
    if (error.message) {
        return error.message;
    }

    // If error has an error property (nested error)
    if (error.error) {
        return getErrorMessage(error.error, fallback);
    }

    // If error can be converted to string
    try {
        const str = error.toString();
        if (str && str !== '[object Object]') {
            return str;
        }
    } catch (e) {
        // toString failed, continue
    }

    // Try to JSON stringify for debugging
    try {
        const json = JSON.stringify(error);
        if (json && json !== '{}') {
            return json;
        }
    } catch (e) {
        // JSON stringify failed, continue
    }

    return fallback;
}

/**
 * Show error notification with robust error handling
 * @param {*} error - Error to display
 * @param {string} context - Context where error occurred (e.g., "beim Erstellen")
 */
async function showError(error, context = '') {
    const message = getErrorMessage(error);
    const fullMessage = context ? `Fehler ${context}: ${message}` : `Fehler: ${message}`;

    console.error('[Error]', context, error);

    // Show notification (assuming notification system exists)
    if (window.showNotification) {
        await window.showNotification(fullMessage, 'error');
    } else {
        alert(fullMessage);
    }
}

/**
 * Show success notification
 * @param {string} message - Success message
 */
async function showSuccess(message) {
    console.log('[Success]', message);

    if (window.showNotification) {
        await window.showNotification(message, 'success');
    }
}

/**
 * Show info notification
 * @param {string} message - Info message
 */
async function showInfo(message) {
    console.log('[Info]', message);

    if (window.showNotification) {
        await window.showNotification(message, 'info');
    }
}

// ==================== Validation ====================

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Validate non-empty string
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length (default: 1)
 * @returns {boolean} - True if valid
 */
function isNonEmpty(value, minLength = 1) {
    return typeof value === 'string' && value.trim().length >= minLength;
}

/**
 * Sanitize string input (prevent XSS)
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(str) {
    if (typeof str !== 'string') {
        return '';
    }

    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    return str.replace(/[&<>"'/]/g, (char) => map[char]);
}

// ==================== Formatting ====================

/**
 * Format date to localized string
 * @param {Date|string|number} date - Date to format
 * @param {string} locale - Locale (default: 'de-DE')
 * @returns {string} - Formatted date string
 */
function formatDate(date, locale = 'de-DE') {
    if (!date) {
        return '';
    }

    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            return '';
        }

        return d.toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        console.error('Error formatting date:', e);
        return '';
    }
}

/**
 * Format date to relative time (e.g., "vor 2 Stunden")
 * @param {Date|string|number} date - Date to format
 * @param {string} locale - Locale (default: 'de')
 * @returns {string} - Relative time string
 */
function formatRelativeTime(date, locale = 'de') {
    if (!date) {
        return '';
    }

    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            return '';
        }

        const now = new Date();
        const diff = now - d;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (locale === 'de') {
            if (seconds < 60) return 'gerade eben';
            if (minutes < 60) return `vor ${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
            if (hours < 24) return `vor ${hours} Stunde${hours !== 1 ? 'n' : ''}`;
            if (days < 7) return `vor ${days} Tag${days !== 1 ? 'en' : ''}`;
            if (days < 30) return `vor ${Math.floor(days / 7)} Woche${Math.floor(days / 7) !== 1 ? 'n' : ''}`;
            if (days < 365) return `vor ${Math.floor(days / 30)} Monat${Math.floor(days / 30) !== 1 ? 'en' : ''}`;
            return `vor ${Math.floor(days / 365)} Jahr${Math.floor(days / 365) !== 1 ? 'en' : ''}`;
        } else {
            if (seconds < 60) return 'just now';
            if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
            if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
            if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''} ago`;
            if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''} ago`;
            return `${Math.floor(days / 365)} year${Math.floor(days / 365) !== 1 ? 's' : ''} ago`;
        }
    } catch (e) {
        console.error('Error formatting relative time:', e);
        return '';
    }
}

/**
 * Truncate string to max length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated string
 */
function truncate(str, maxLength = 50) {
    if (!str || typeof str !== 'string') {
        return '';
    }

    if (str.length <= maxLength) {
        return str;
    }

    return str.substring(0, maxLength - 3) + '...';
}

// ==================== DOM Helpers ====================

/**
 * Create icon element using Phosphor Icons
 * @param {string} iconName - Icon name (e.g., 'house', 'star', 'trash')
 * @param {string} className - Additional CSS classes
 * @param {number} size - Icon size in pixels (default: 24)
 * @returns {SVGElement} - SVG icon element
 */
function createIcon(iconName, className = '', size = 24) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 256 256');
    svg.setAttribute('fill', 'currentColor');
    if (className) {
        svg.setAttribute('class', className);
    }

    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#ph-${iconName}`);
    svg.appendChild(use);

    return svg;
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} - Throttled function
 */
function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==================== Storage Helpers ====================

/**
 * Safe localStorage get
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} - Stored value or default
 */
function getStorageItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return defaultValue;
    }
}

/**
 * Safe localStorage set
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} - True if successful
 */
function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Error writing to localStorage:', e);
        return false;
    }
}

// ==================== Async Helpers ====================

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} - Result of function or error
 */
async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) {
                throw error;
            }

            console.warn(`Retry attempt ${i + 1}/${maxRetries} failed:`, error);
            await sleep(delay * Math.pow(2, i)); // Exponential backoff
        }
    }
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== Export to global scope ====================

window.utils = {
    // Error handling
    getErrorMessage,
    showError,
    showSuccess,
    showInfo,

    // Validation
    isValidEmail,
    isNonEmpty,
    sanitizeString,

    // Formatting
    formatDate,
    formatRelativeTime,
    truncate,

    // DOM helpers
    createIcon,
    debounce,
    throttle,

    // Storage
    getStorageItem,
    setStorageItem,

    // Async
    retryWithBackoff,
    sleep,
};

console.log('[Utils] Utility functions loaded successfully');
