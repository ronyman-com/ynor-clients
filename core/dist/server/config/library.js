const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { URL } = require('url');
const loadSettings = require('./loadSettings');

// Updated Configuration with server/data paths
const CONFIG = {
  DATA_DIR: path.join(__dirname, '../../server/data'),
  SEARCH_DIR: path.join(__dirname, '../../server/data/search'),
  SUGGESTIONS_DIR: path.join(__dirname, '../../server/data/suggestions'),
  USER_PROFILES_DIR: path.join(__dirname, '../../server/data/profiles'),
  CACHE_TIME: 1000 * 60 * 60 * 24, // 24 hours
  SUGGESTIONS_API: 'https://suggestqueries.google.com/complete/search',
  OPERATORS: {
    site: { icon: '🌐', description: 'Search within a specific site' },
    filetype: { icon: '📄', description: 'Search for specific file types' },
    intitle: { icon: '🔍', description: 'Search in page titles' },
    inurl: { icon: '🔗', description: 'Search in URLs' },
    before: { icon: '📅', description: 'Results before a date' },
    after: { icon: '📅', description: 'Results after a date' }
  },
  SHORTCUTS: {
    'w': 'site:wikipedia.org',
    'yt': 'site:youtube.com',
    'm': 'site:medium.com',
    'g': 'site:github.com',
    'n': 'site:news.ycombinator.com'
  }
};

// Ensure directories exist
function ensureDirectories() {
  try {
    [CONFIG.DATA_DIR, CONFIG.SEARCH_DIR, CONFIG.SUGGESTIONS_DIR, CONFIG.USER_PROFILES_DIR].forEach(dir => {
      fs.ensureDirSync(dir);
      console.log(`✅ Directory ensured: ${dir}`);
    });
  } catch (err) {
    console.error('❌ Failed to create directories:', err);
    throw err;
  }
}

class SearchService {
  constructor() {
    this.cache = new Map();
    this.userPreferences = new Map();
    this.settings = {};
    this.isInitialized = false;
    
    // Initialize directories immediately
    ensureDirectories();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load settings
      this.settings = await loadSettings();
      console.log('✅ Settings loaded');
      
      this.isInitialized = true;
    } catch (err) {
      console.error('❌ Initialization error:', err);
      throw err;
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Generate all data files for a user
   */
  async generateUserData(userId) {
    try {
      await this.dataGenerator.generateAllData(userId);
      return { success: true, message: 'Data generated successfully' };
    } catch (err) {
      console.error('❌ Data generation error:', err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query, userId = 'anonymous') {
    try {
      await this.ensureInitialized();
      
      const cacheKey = `suggestions:${query}`;
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;

      const response = await axios.get(CONFIG.SUGGESTIONS_API, {
        params: {
          client: 'firefox',
          q: query,
          hl: 'en'
        },
        timeout: 5000 // 5 second timeout
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid suggestions response format');
      }

      const suggestions = response.data[1] || [];
      this._saveToCache(cacheKey, suggestions);
      
      if (userId !== 'anonymous') {
        await this._saveUserSuggestions(userId, query, suggestions);
      }

      return suggestions;
    } catch (error) {
      console.error('Suggestions error:', error.message);
      // Fallback to personalized suggestions
      try {
        return await this._getPersonalizedSuggestions(query, userId);
      } catch (fallbackError) {
        console.error('Fallback suggestions failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Get advanced search operators
   */
  getSearchOperators() {
    return CONFIG.OPERATORS;
  }

  /**
   * Process search shortcuts
   */
  processShortcuts(query) {
    const parts = query.split(' ');
    if (parts.length > 1 && CONFIG.SHORTCUTS[parts[0]]) {
      return query.replace(parts[0], CONFIG.SHORTCUTS[parts[0]]);
    }
    return query;
  }

  /**
   * Track user visits for personalized ranking
   */
  async trackVisit(userId, url, query) {
    try {
      const profilePath = path.join(CONFIG.USER_PROFILES_DIR, `${userId}.json`);
      const profile = await this._getUserProfile(userId);
      
      // Update visited sites
      profile.visitedSites = profile.visitedSites || {};
      profile.visitedSites[url] = (profile.visitedSites[url] || 0) + 1;
      
      // Update search history
      profile.searchHistory = profile.searchHistory || [];
      profile.searchHistory.unshift({
        query,
        url,
        timestamp: new Date().toISOString()
      });
      
      await fs.writeJson(profilePath, profile, { spaces: 2 });
      
      // Regenerate user data after tracking
      await this.generateUserData(userId);
    } catch (error) {
      console.error('Tracking error:', error);
    }
  }

  /**
   * Get personalized results ranking
   */
  async personalizeResults(userId, results) {
    try {
      const profile = await this._getUserProfile(userId);
      if (!profile?.visitedSites) return results;
      
      return results.map(result => {
        const boost = profile.visitedSites[result.link] || 0;
        return {
          ...result,
          score: (result.score || 0) + (boost * 0.5) // Boost ranking
        };
      }).sort((a, b) => b.score - a.score);
    } catch (error) {
      return results;
    }
  }

  // Private helper methods
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_TIME) {
      return cached.data;
    }
    return null;
  }

  _saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async _getUserProfile(userId) {
    const profilePath = path.join(CONFIG.USER_PROFILES_DIR, `${userId}.json`);
    return fs.pathExists(profilePath) 
      ? fs.readJson(profilePath) 
      : { userId, preferences: {} };
  }

  async _saveUserSuggestions(userId, query, suggestions) {
    const profile = await this._getUserProfile(userId);
    profile.suggestions = profile.suggestions || {};
    profile.suggestions[query] = suggestions;
    const profilePath = path.join(CONFIG.USER_PROFILES_DIR, `${userId}.json`);
    await fs.writeJson(profilePath, profile, { spaces: 2 });
  }

  async _getPersonalizedSuggestions(query, userId) {
    try {
      const profile = await this._getUserProfile(userId);
      if (!profile?.suggestions) return [];
      
      // Find suggestions for similar queries
      return Object.entries(profile.suggestions)
        .filter(([key]) => key.includes(query))
        .flatMap(([, suggestions]) => suggestions);
    } catch (error) {
      return [];
    }
  }
}


// Create and export singleton instance
const searchService = new SearchService();
module.exports = searchService;