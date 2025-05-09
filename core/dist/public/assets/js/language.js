// public/assets/js/language.js

/**
 * YNOR Browser Language Manager
 * Handles client-side language detection, loading, and switching
 * Integrates with server-side language configuration
 */
class LanguageManager {
    constructor() {
      // Initialize with window config or defaults
      this.config = window.languageConfig || {
        current: 'en',
        available: ['en'],
        translations: {}
      };
  
      this.currentLanguage = null;
      this.translations = {};
      this.rtlLanguages = ['ar', 'he', 'fa', 'ur']; // RTL language codes
      this.initialized = false;
    }
  
    /**
     * Initialize the language manager
     */
    async init() {
      if (this.initialized) return;
  
      try {
        // Try to load saved language preference
        const savedLang = localStorage.getItem('ynor-language') || 
                         this.config.current ||
                         navigator.language.split('-')[0];
  
        // Validate and set language
        await this.setLanguage(this.validateLanguage(savedLang) ? savedLang : 'en');
        
        // Initialize language selector if exists
        this.initLanguageSelector();
        
        this.initialized = true;
      } catch (error) {
        console.error('LanguageManager initialization failed:', error);
        // Fallback to English
        await this.setLanguage('en');
      }
    }
  
    /**
     * Set the current language and load translations
     * @param {string} langCode - Language code to set
     */
    async setLanguage(langCode) {
      if (this.currentLanguage?.code === langCode) return;
  
      try {
        // Load translations
        const response = await fetch(`/locales/${langCode}.json`);
        if (!response.ok) throw new Error('Failed to load translations');
        
        this.translations = await response.json();
        this.currentLanguage = {
          code: langCode,
          rtl: this.rtlLanguages.includes(langCode)
        };
  
        // Apply to UI
        this.applyTranslations();
        this.applyDirection();
        
        // Save preference
        localStorage.setItem('ynor-language', langCode);
        document.documentElement.lang = langCode;
  
        // Update config
        this.config.current = langCode;
  
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', {
          detail: { language: langCode }
        }));
  
        return true;
      } catch (error) {
        console.error(`Failed to set language to ${langCode}:`, error);
        
        // Fallback to English if not already English
        if (langCode !== 'en') {
          return this.setLanguage('en');
        }
        return false;
      }
    }
  
    /**
     * Apply translations to the page
     */
    applyTranslations() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (this.translations[key]) {
          el.textContent = this.translations[key];
        }
      });
    }
  
    /**
     * Apply RTL/LTR direction to the page
     */
    applyDirection() {
      const dir = this.currentLanguage.rtl ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.body.classList.toggle('rtl', this.currentLanguage.rtl);
    }
  
    /**
     * Initialize language selector dropdown
     */
    initLanguageSelector() {
      const selector = document.getElementById('languageSelect');
      if (!selector) return;
  
      // Set current selection
      if (this.currentLanguage) {
        selector.value = this.currentLanguage.code;
      }
  
      // Add change handler
      selector.addEventListener('change', async () => {
        await this.setLanguage(selector.value);
      });
    }
  
    /**
     * Translate a key
     * @param {string} key - Translation key
     * @param {string} fallback - Fallback text if key not found
     * @returns {string} Translated text
     */
    translate(key, fallback = '') {
      return this.translations[key] || fallback || key;
    }
  
    /**
     * Check if language is available
     * @param {string} langCode - Language code to validate
     * @returns {boolean} True if language is available
     */
    validateLanguage(langCode) {
      return this.config.available.includes(langCode);
    }
  
    /**
     * Get current language code
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
      return this.currentLanguage?.code || 'en';
    }
  
    /**
     * Get all available languages
     * @returns {array} List of available language codes
     */
    getAvailableLanguages() {
      return this.config.available;
    }
  }
  
  // Create and initialize the language manager
  const languageManager = new LanguageManager();
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    languageManager.init().catch(error => {
      console.error('Language initialization error:', error);
    });
  });
  
  // Make available globally
  window.LanguageManager = LanguageManager;
  window.languageManager = languageManager;
  
  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageManager;
  }