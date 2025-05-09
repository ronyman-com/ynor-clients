// server/config/loadSettings.js
const fs = require('fs-extra');
const path = require('path');

async function loadSettings() {
  const settingsPath = path.join(__dirname, 'settings.json');
  const defaultSettings = {
    homePage: 'https://start.ynor.org',
    theme: 'light',
    searchEngine: 'https://search.ynor.org?q=',
    fontSize: '16px',
    startupBehavior: 'home',
    privacy: {  // Ensure privacy object exists
      trackingProtection: true,
      rememberHistory: true,
      analytics: false
    },
    bookmarks: {  // Ensure bookmarks object exists
      visible: true,
      maxItems: 10,
      categories: []
    }
  };

  try {
    if (!await fs.pathExists(settingsPath)) {
      await fs.writeJson(settingsPath, defaultSettings, { spaces: 2 });
      console.log('ℹ️ Created default settings file');
      return defaultSettings;
    }

    const userSettings = await fs.readJson(settingsPath);
    
    // Deep merge with defaults
    return {
      ...defaultSettings,
      ...userSettings,
      privacy: {
        ...defaultSettings.privacy,
        ...(userSettings.privacy || {})  // Fallback to empty object if undefined
      },
      bookmarks: {
        ...defaultSettings.bookmarks,
        ...(userSettings.bookmarks || {})  // Fallback to empty object if undefined
      }
    };
  } catch (error) {
    console.error('⚠️ Error loading settings, using defaults:', error.message);
    return defaultSettings;
  }
}

module.exports = loadSettings;