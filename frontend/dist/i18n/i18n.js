// i18n Translation System for CV Manager Pro
// Supports: German (de) and English (en)
// Default: German (de)

class I18n {
    constructor() {
        this.currentLang = 'de'; // Default to German
        this.translations = {};
        this.fallbackLang = 'en';
    }

    async init() {
        try {
            // Load German (default) and English translations
            await this.loadLanguage('de');
            await this.loadLanguage('en');

            // Set language from localStorage or default to German
            const savedLang = localStorage.getItem('language') || 'de';
            this.setLanguage(savedLang);
        } catch (error) {
            console.error('i18n init failed:', error);
            // Use minimal fallback
            this.translations['de'] = { app: { title: 'CV Manager Pro' } };
            this.translations['en'] = { app: { title: 'CV Manager Pro' } };
            this.currentLang = 'de';
        }
    }

    async loadLanguage(lang) {
        try {
            const response = await fetch(`./i18n/${lang}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.translations[lang] = await response.json();
            console.log(`Loaded ${lang} translations`);
        } catch (error) {
            console.error(`Failed to load ${lang} translations:`, error);
            // Don't throw, just log the error
        }
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('language', lang);
            this.updateUI();
            console.log(`Language set to: ${lang}`);
        } else {
            console.error(`Language ${lang} not available`);
        }
    }

    getCurrentLanguage() {
        return this.currentLang;
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];

        // Navigate through nested object
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                // Fallback to English if key not found in current language
                value = this.translations[this.fallbackLang];
                for (const fk of keys) {
                    if (value && value[fk] !== undefined) {
                        value = value[fk];
                    } else {
                        console.warn(`Translation key not found: ${key}`);
                        return key;
                    }
                }
                break;
            }
        }

        return value || key;
    }

    updateUI() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);

            // Check if it should update placeholder
            if (element.hasAttribute('data-i18n-placeholder')) {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Update placeholders separately
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Update title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Dispatch language change event
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLang }
        }));
    }
}

// Global i18n instance
window.i18n = new I18n();
