// server/config/theme.js
const fs = require('fs');
const path = require('path');

class ThemeConfig {
  constructor() {
    this.themesPath = path.join(__dirname, '../../public/assets/themes');
    this.defaultTheme = {
      mode: 'light', // 'light' or 'dark'
      compact: false,
      primaryColor: '#3a86ff',
      secondaryColor: '#6c5ce7'
    };
  }

  getAvailableThemes() {
    try {
      const themes = fs.readdirSync(this.themesPath)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const theme = JSON.parse(fs.readFileSync(path.join(this.themesPath, file), 'utf8'));
          return {
            name: theme.name || path.basename(file, '.json'),
            id: path.basename(file, '.json'),
            ...theme
          };
        });
      return themes;
    } catch (error) {
      console.error('Error loading themes:', error);
      return [this.defaultTheme];
    }
  }

  getCurrentTheme(req) {
    return req.session.theme || this.defaultTheme;
  }

  saveThemePreferences(req, preferences) {
    req.session.theme = {
      ...this.getCurrentTheme(req),
      ...preferences
    };
    return req.session.theme;
  }

  generateThemeStyles(theme) {
    return `
      :root {
        /* Dynamic theme colors */
        --primary: ${theme.primaryColor || '#4285f4'};
        --primary-dark: ${this.darkenColor(theme.primaryColor || '#4285f4', 15)};
        --primary-light: ${this.lightenColor(theme.primaryColor || '#4285f4', 15)};
        --secondary: ${theme.secondaryColor || '#34a853'};
        --secondary-dark: ${this.darkenColor(theme.secondaryColor || '#34a853', 15)};
        --secondary-light: ${this.lightenColor(theme.secondaryColor || '#34a853', 15)};
      }
    `;
  }

  getDarkModeCSS() {
    return `
      --bg-primary: var(--gray-900);
      --bg-secondary: var(--gray-800);
      --text-primary: var(--gray-100);
      --text-secondary: var(--gray-400);
      --text-light: var(--gray-600);
      --border-color: var(--gray-700);
    `;
  }

  getCompactModeCSS() {
    return `
      --header-height: 50px;
      --top-menu-height: 40px;
      --spacer: 0.75rem;
      --spacer-sm: 0.375rem;
      --spacer-lg: 1rem;
      --spacer-xl: 1.5rem;
    `;
  }

  // Properly defined as a class method
  darkenColor(hex, percent) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse r, g, b values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Darken each component
    r = Math.max(0, Math.floor(r * (100 - percent) / 100)),
    g = Math.max(0, Math.floor(g * (100 - percent) / 100)),
    b = Math.max(0, Math.floor(b * (100 - percent) / 100)),

    // Convert back to hex
    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
  }

  // Properly defined as a class method
  lightenColor(hex, percent) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse r, g, b values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Lighten each component
    r = Math.min(255, Math.floor(r + (255 - r) * percent / 100)),
    g = Math.min(255, Math.floor(g + (255 - g) * percent / 100)),
    b = Math.min(255, Math.floor(b + (255 - b) * percent / 100)),

    // Convert back to hex
    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
  }
}

const themeConfig = new ThemeConfig();





module.exports = {
  themeConfig,
  getAvailableThemes: themeConfig.getAvailableThemes.bind(themeConfig),
  getCurrentTheme: themeConfig.getCurrentTheme.bind(themeConfig),
  saveThemePreferences: themeConfig.saveThemePreferences.bind(themeConfig),
  generateThemeStyles: themeConfig.generateThemeStyles.bind(themeConfig)
};