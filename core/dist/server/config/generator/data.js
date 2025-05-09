// server/config/generator/data.js
const path = require('path');
const fs = require('fs').promises;
const db = require('../../models/db');
const { ensureDir } = require('../../utils/fileUtils');

class DataGenerator {
  constructor() {
    // Changed path to server/data
    this.outputDir = path.resolve(__dirname, '../../data');
  }

  async initialize() {
    try {
      await ensureDir(this.outputDir);
      console.log('✅ Data generator initialized. Output directory:', this.outputDir);
      
      // Verify directory exists and is writable
      await fs.access(this.outputDir, fs.constants.W_OK);
      console.log('✅ Directory is writable');
    } catch (err) {
      console.error('❌ Failed to initialize data generator:', err);
      throw err;
    }
  }

  async generateAllData(userId) {
    try {
      await this.initialize();
      
      // Generate data for all pages
      await Promise.all([
        this.generateBrowseData(userId),
        this.generateHistoryData(userId),
        this.generateProfileData(userId),
        this.generateSearchData(userId),
        this.generateSettingsData(userId),
        this.generateSystemData() // for System Data
      ]);
      
      console.log('✅ All data files generated successfully');
    } catch (err) {
      console.error('❌ Error generating data files:', err);
      throw err;
    }
  }

  // System Data
  async generateSystemData() {
    try {
      const [users, shortcuts, bookmarks] = await Promise.all([
        db.getAll('SELECT id, email, role, created_at FROM users'),
        db.getAll('SELECT COUNT(*) as count FROM shortcuts'),
        db.getAll('SELECT COUNT(*) as count FROM bookmarks')
      ]);

      const data = {
        meta: {
          generatedAt: new Date().toISOString(),
          type: 'system',
          version: require('../../../package.json').version
        },
        stats: {
          users: users.length,
          shortcuts: shortcuts[0].count,
          bookmarks: bookmarks[0].count
        },
        recentUsers: users
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(u => ({
            id: u.id,
            email: u.email,
            role: u.role,
            joinedAt: u.created_at
          }))
      };

      await this.saveToFile('system', data);
      return data;
    } catch (err) {
      console.error('❌ Error generating system data:', err);
      throw err;
    }
  }
  async saveToFile(filename, data) {
    const filePath = path.join(this.outputDir, `${filename}.json`);
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`✔️ Generated ${filename}.json at ${filePath}`);
    } catch (err) {
      console.error(`❌ Failed to write ${filename}.json:`, err);
      throw err;
    }
  }

  // Generate data for browse.ejs
  async generateBrowseData(userId) {
    try {
      const [shortcuts, bookmarks] = await Promise.all([
        db.getAll('SELECT * FROM shortcuts WHERE user_id = ? OR is_public = 1', [userId]),
        db.getBookmarks(userId, { limit: 50 })
      ]);

      const data = {
        meta: {
          generatedAt: new Date().toISOString(),
          type: 'browse',
          count: {
            shortcuts: shortcuts.length,
            bookmarks: bookmarks.length
          }
        },
        shortcuts: shortcuts.map(s => ({
          id: s.shortcut_id,
          name: s.name,
          url: s.url,
          icon: s.icon_path,
          isPublic: Boolean(s.is_public)
        })),
        bookmarks: bookmarks.map(b => ({
          id: b.id,
          url: b.url,
          title: b.title,
          description: b.description,
          tags: b.tags ? JSON.parse(b.tags) : [],
          isFavorite: Boolean(b.is_favorite),
          createdAt: b.created_at
        }))
      };

      await this.saveToFile('browse', data);
      return data;
    } catch (err) {
      console.error('❌ Error generating browse data:', err);
      throw err;
    }
  }

  // Generate data for history.ejs
  async generateHistoryData(userId) {
    try {
      // Note: You'll need to add a history table to your database for this to work
      const history = await db.getAll(
        `SELECT * FROM history 
         WHERE user_id = ? 
         ORDER BY visited_at DESC 
         LIMIT 100`, 
        [userId]
      );

      const data = {
        meta: {
          generatedAt: new Date().toISOString(),
          type: 'history',
          count: history.length
        },
        history: history.map(h => ({
          id: h.id,
          url: h.url,
          title: h.title,
          visitedAt: h.visited_at,
          visitCount: h.visit_count
        }))
      };

      await this.saveToFile('history', data);
      return data;
    } catch (err) {
      console.error('❌ Error generating history data:', err);
      throw err;
    }
  }

  // Generate data for profile.ejs
  async generateProfileData(userId) {
    try {
      const [profile, shortcuts, bookmarks] = await Promise.all([
        db.getOne('SELECT * FROM profiles WHERE user_id = ?', [userId]),
        db.getAll('SELECT * FROM shortcuts WHERE user_id = ?', [userId]),
        db.getBookmarks(userId, { favoriteOnly: true, limit: 10 })
      ]);

      const data = {
        meta: {
          generatedAt: new Date().toISOString(),
          type: 'profile',
          userId: userId
        },
        profile: profile ? {
          name: profile.name,
          avatar: profile.avatar_path,
          settings: profile.settings ? JSON.parse(profile.settings) : {}
        } : null,
        stats: {
          shortcuts: shortcuts.length,
          bookmarks: bookmarks.length
        },
        favorites: bookmarks.map(b => ({
          id: b.id,
          title: b.title,
          url: b.url
        }))
      };

      await this.saveToFile('profile', data);
      return data;
    } catch (err) {
      console.error('❌ Error generating profile data:', err);
      throw err;
    }
  }

  // Generate data for search.ejs
  async generateSearchData(userId) {
    try {
      const [bookmarks, shortcuts] = await Promise.all([
        db.getAll('SELECT id, url, title FROM bookmarks WHERE user_id = ?', [userId]),
        db.getAll('SELECT shortcut_id as id, name as title, url FROM shortcuts WHERE user_id = ? OR is_public = 1', [userId])
      ]);

      const data = {
        meta: {
          generatedAt: new Date().toISOString(),
          type: 'search',
          count: {
            bookmarks: bookmarks.length,
            shortcuts: shortcuts.length
          }
        },
        index: [
          ...bookmarks.map(b => ({
            type: 'bookmark',
            id: b.id,
            title: b.title,
            url: b.url
          })),
          ...shortcuts.map(s => ({
            type: 'shortcut',
            id: s.id,
            title: s.title,
            url: s.url
          }))
        ]
      };

      await this.saveToFile('search', data);
      return data;
    } catch (err) {
      console.error('❌ Error generating search data:', err);
      throw err;
    }
  }

  // Generate data for settings.ejs
  async generateSettingsData(userId) {
    try {
      const [user, profile] = await Promise.all([
        db.getOne('SELECT email, role, created_at FROM users WHERE id = ?', [userId]),
        db.getOne('SELECT name, avatar_path, settings FROM profiles WHERE user_id = ?', [userId])
      ]);

      const data = {
        meta: {
          generatedAt: new Date().toISOString(),
          type: 'settings'
        },
        user: {
          email: user.email,
          role: user.role,
          joinedAt: user.created_at
        },
        profile: profile ? {
          name: profile.name,
          avatar: profile.avatar_path,
          settings: profile.settings ? JSON.parse(profile.settings) : {}
        } : null,
        preferences: {
          theme: 'system', // Default value
          language: 'en',  // Default value
          ...(profile?.settings ? JSON.parse(profile.settings).preferences : {})
        }
      };

      await this.saveToFile('settings', data);
      return data;
    } catch (err) {
      console.error('❌ Error generating settings data:', err);
      throw err;
    }
  }
}

/////////////////////CURRENT WORKIG SPACE


  

///////////////////////////// END CURRENT WORKIN SPACE


// Singleton instance
const dataGenerator = new DataGenerator();

module.exports = dataGenerator;