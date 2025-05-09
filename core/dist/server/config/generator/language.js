// server/config/generator/language.js
const path = require('path');
const fs = require('fs');

class LanguageConfig {
  constructor() {
    this.localesPath = path.join(__dirname, '../../../src/locales');
    this.languages = this.loadLanguages();
  }

  loadLanguages() {
    try {
      // Read the locales index file
      const localesIndex = JSON.parse(
        fs.readFileSync(path.join(this.localesPath, 'locales.json'), 'utf8')
      );

      // Define all supported languages with metadata
      const allLanguages = [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          flag: '🇬🇧',
          rtl: false,
          default: true
        },
        {
          code: 'es',
          name: 'Spanish',
          nativeName: 'Español',
          flag: '🇪🇸',
          rtl: false
        },
        {
          code: 'fr',
          name: 'French',
          nativeName: 'Français',
          flag: '🇫🇷',
          rtl: false
        },
        {
          code: 'de',
          name: 'German',
          nativeName: 'Deutsch',
          flag: '🇩🇪',
          rtl: false
        },
        {
          code: 'it',
          name: 'Italian',
          nativeName: 'Italiano',
          flag: '🇮🇹',
          rtl: false
        },
        {
          code: 'pt',
          name: 'Portuguese',
          nativeName: 'Português',
          flag: '🇵🇹',
          rtl: false
        },
        {
          code: 'ru',
          name: 'Russian',
          nativeName: 'Русский',
          flag: '🇷🇺',
          rtl: false
        },
        {
          code: 'zh',
          name: 'Chinese',
          nativeName: '中文',
          flag: '🇨🇳',
          rtl: false
        },
        {
          code: 'ja',
          name: 'Japanese',
          nativeName: '日本語',
          flag: '🇯🇵',
          rtl: false
        },
        {
          code: 'ar',
          name: 'Arabic',
          nativeName: 'العربية',
          flag: '🇸🇦',
          rtl: true
        },
        {
          code: 'hi',
          name: 'Hindi',
          nativeName: 'हिन्दी',
          flag: '🇮🇳',
          rtl: false
        }
      ];

      // Filter to only include languages that exist in locales.json
      return allLanguages.filter(lang => localesIndex[lang.code]);
    } catch (error) {
      console.error('Error loading language configuration:', error);
      // Return at least English as a fallback
      return [{
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        rtl: false,
        default: true
      }];
    }
  }

  getLanguages() {
    return this.languages;
  }

  getDefaultLanguage() {
    return this.languages.find(lang => lang.default) || this.languages[0];
  }

  getLanguage(code) {
    return this.languages.find(lang => lang.code === code);
  }

  validateLanguage(code) {
    return this.languages.some(lang => lang.code === code);
  }

  getAvailableLocales() {
    return this.languages.map(lang => lang.code);
  }

  // For server-side translation if needed
  getTranslation(langCode, key) {
    try {
      const translationFile = path.join(
        this.localesPath,
        `${langCode}.json`
      );
      const translations = JSON.parse(fs.readFileSync(translationFile, 'utf8'));
      return translations[key] || key;
    } catch (error) {
      console.error(`Error loading translation for ${key} in ${langCode}:`, error);
      return key;
    }
  }

  // Generate language switcher HTML for server-side rendering
  generateLanguageSwitcher(currentLang) {
    return `
      <select id="languageSelect" class="settings-select">
        ${this.languages.map(lang => `
          <option value="${lang.code}" 
                  data-flag="${lang.flag}" 
                  ${lang.rtl ? 'data-rtl="true"' : ''}
                  ${currentLang === lang.code ? 'selected' : ''}>
            ${lang.flag} ${lang.nativeName} (${lang.name})
          </option>
        `).join('')}
      </select>
    `;
  }

  getLanguageScripts() {
    return `
      <script>
        // Language configuration
        window.languageConfig = {
          current: '${this.getDefaultLanguage().code}',
          available: ${JSON.stringify(this.getAvailableLocales())},
          translations: {
            // Can preload default translations here if needed
          }
        };
        
        // Initialize language manager
        document.addEventListener('DOMContentLoaded', () => {
          if (window.languageManager) {
            window.languageManager.init();
          }
        });
      </script>
    `;
  }

  getLanguageSwitcher(currentLang) {
    return `
      <select id="languageSelect" class="settings-select" aria-label="Language selector">
        ${this.languages.map(lang => `
          <option value="${lang.code}" 
                  data-flag="${lang.flag}"
                  ${lang.rtl ? 'data-rtl="true"' : ''}
                  ${currentLang === lang.code ? 'selected' : ''}>
            ${lang.flag} ${lang.nativeName}
          </option>
        `).join('')}
      </select>
    `;
  }
}

// Create singleton instance
const languageConfig = new LanguageConfig();

module.exports = {
  languages: languageConfig.getLanguages(),
  defaultLanguage: languageConfig.getDefaultLanguage(),
  getLanguage: languageConfig.getLanguage.bind(languageConfig),
  validateLanguage: languageConfig.validateLanguage.bind(languageConfig),
  getAvailableLocales: languageConfig.getAvailableLocales.bind(languageConfig),
  getTranslation: languageConfig.getTranslation.bind(languageConfig),
  generateLanguageSwitcher: languageConfig.generateLanguageSwitcher.bind(languageConfig),
  languageConfig, // Expose the full config object if needed
  getLanguageScripts: languageConfig.getLanguageScripts.bind(languageConfig),
  getLanguageSwitcher: languageConfig.getLanguageSwitcher.bind(languageConfig)
};