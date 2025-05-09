const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class Database {
  constructor() {
    this.dbPath = path.resolve(__dirname, '../../database/ynor.db');
    this.dbDir = path.dirname(this.dbPath);
    this.connection = null;
    this.isInitialized = false;
  }

  async connect() {
    try {
      // Ensure database directory exists
      await fs.mkdir(this.dbDir, { recursive: true });
      
      // Open database connection
      this.connection = new sqlite3.Database(
        this.dbPath,
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX,
        async (err) => {
          if (err) throw err;
          console.log('✅ Connected to SQLite database at:', this.dbPath);
          await this.initializeSchema();
          this.isInitialized = true;
        }
      );
      
      return this.connection;
    } catch (err) {
      console.error('❌ Database connection error:', err.message);
      process.exit(1);
    }
  }

  async initializeSchema() {
    return new Promise((resolve, reject) => {
      this.connection.serialize(() => {
        // Enable database optimizations
        this.connection.run('PRAGMA foreign_keys = ON');
        this.connection.run('PRAGMA journal_mode = WAL');
        this.connection.run('PRAGMA busy_timeout = 5000');

        // Create tables with schema migrations
        this.createTables()
          .then(() => this.migrateExistingSchema())
          .then(() => {
            console.log('✔️ Database schema initialized and migrated');
            resolve();
          })
          .catch(reject);
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      // Users table
      this.connection.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL CHECK(email LIKE '%@%.%'),
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, [], (err) => err && reject(err));

      // Shortcuts table
      this.connection.run(`
        CREATE TABLE IF NOT EXISTS shortcuts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          shortcut_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL CHECK(length(name) <= 100),
          url TEXT NOT NULL CHECK(url LIKE 'http%'),
          icon_path TEXT,
          manifest TEXT,
          html TEXT,
          is_public BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, [], (err) => err && reject(err));

      // Profiles table
      this.connection.run(`
        CREATE TABLE IF NOT EXISTS profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL CHECK(length(name) <= 50),
          avatar_path TEXT,
          settings TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, [], (err) => err && reject(err));

      // Bookmarks table
      this.connection.run(`
        CREATE TABLE IF NOT EXISTS bookmarks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          url TEXT NOT NULL CHECK(url LIKE 'http%'),
          title TEXT NOT NULL CHECK(length(title) <= 255),
          description TEXT,
          tags TEXT,
          is_favorite BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, [], (err) => err && reject(err));

      // Create indexes
      this.connection.run(
        'CREATE INDEX IF NOT EXISTS idx_shortcut_user ON shortcuts(user_id)',
        [], (err) => err && reject(err)
      );
      this.connection.run(
        'CREATE INDEX IF NOT EXISTS idx_shortcut_id ON shortcuts(shortcut_id)',
        [], (err) => err && reject(err)
      );
      this.connection.run(
        'CREATE INDEX IF NOT EXISTS idx_profile_user ON profiles(user_id)',
        [], (err) => err && reject(err)
      );
      this.connection.run(
        'CREATE INDEX IF NOT EXISTS idx_bookmark_user ON bookmarks(user_id)',
        [], (err) => err && reject(err)
      );

      resolve();
    });
  }


  ///////////////// DATABASE MIGRATE FROM HERE.///////////////

 // Add this to the migrateExistingSchema method in db.js
async migrateExistingSchema() {
  return new Promise(async (resolve) => {
    try {
      console.log('🔄 Starting schema migrations...');
      
      // 1. Migrate users table (add new columns if needed)
      await this.migrateUsersTable();
      
      // 2. Migrate shortcuts table
      await this.migrateShortcutsTable();
      
      // 3. Migrate bookmarks table
      await this.migrateBookmarksTable();
      
      // 4. Migrate profiles table
      await this.migrateProfilesTable();
      
      // 5. Create history table if needed
      await this.createHistoryTable();
      
      console.log('✅ Schema migrations completed');
      resolve();
    } catch (error) {
      console.error('❌ Migration failed:', error);
      resolve();
    }
  });
}

async migrateUsersTable() {
  // Add any new columns to users table
  const columnsToAdd = [
    { name: 'last_login', type: 'DATETIME' },
    { name: 'is_active', type: 'BOOLEAN DEFAULT 1' }
  ];

  for (const column of columnsToAdd) {
    const exists = await this.getOne(
      `SELECT 1 FROM pragma_table_info('users') WHERE name = '${column.name}'`
    );
    if (!exists) {
      await this.run(
        `ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`
      );
      console.log(`✔️ Added column ${column.name} to users table`);
    }
  }
}

async migrateProfilesTable() {
  // Ensure profiles table has all required columns
  const columnsToAdd = [
    { name: 'bio', type: 'TEXT' },
    { name: 'location', type: 'TEXT' }
  ];

  for (const column of columnsToAdd) {
    const exists = await this.getOne(
      `SELECT 1 FROM pragma_table_info('profiles') WHERE name = '${column.name}'`
    );
    if (!exists) {
      await this.run(
        `ALTER TABLE profiles ADD COLUMN ${column.name} ${column.type}`
      );
      console.log(`✔️ Added column ${column.name} to profiles table`);
    }
  }
}

async createHistoryTable() {
  const tableExists = await this.getOne(
    "SELECT 1 FROM sqlite_master WHERE type='table' AND name='history'"
  );
  
  if (!tableExists) {
    await this.run(`
      CREATE TABLE history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        title TEXT,
        visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        visit_count INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    await this.run(
      'CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id)'
    );
    
    await this.run(
      'CREATE INDEX IF NOT EXISTS idx_history_url ON history(url)'
    );
    
    console.log('✔️ Created history table and indexes');
  }
}



  async executeMigrations(resolve, inTransaction) {
    try {
      console.log(`🔄 Starting migrations (inTransaction: ${inTransaction})...`);
  
      // 1. Migrate shortcuts table
      await this.migrateShortcutsTable();
  
      // 2. Migrate bookmarks table
      await this.migrateBookmarksTable();
  
      // Add other migrations here...
  
      if (!inTransaction) {
        await this.run('COMMIT');
        console.log('✅ Migrations completed successfully');
      } else {
        console.log('ℹ️  Migrations completed within existing transaction');
      }
      resolve();
    } catch (migrationErr) {
      console.error('❌ Migration failed:', migrationErr.message);
      if (!inTransaction) {
        try {
          await this.run('ROLLBACK');
          console.log('🔴 Rolled back failed migrations');
        } catch (rollbackErr) {
          console.error('❌ Rollback failed:', rollbackErr.message);
        }
      }
      resolve();
    }
  }
  
  async migrateShortcutsTable() {
    try {
      // Check if is_public column exists using PRAGMA
      const columnExists = await this.getOne(
        "SELECT 1 FROM pragma_table_info('shortcuts') WHERE name = 'is_public'"
      );
  
      if (!columnExists) {
        console.log('🔄 Adding is_public column to shortcuts table...');
        await this.run(
          `ALTER TABLE shortcuts ADD COLUMN is_public BOOLEAN DEFAULT 0`
        );
        console.log('✔️ Added is_public column to shortcuts');
      }
    } catch (err) {
      console.warn('⚠️ Error migrating shortcuts table:', err.message);
      throw err;
    }
  }
  
  async migrateBookmarksTable() {
    try {
      // Check if bookmarks table exists
      const tableExists = await this.getOne(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='bookmarks'"
      );
  
      if (!tableExists) {
        console.log('🔄 Creating bookmarks table...');
        await this.run(`
          CREATE TABLE bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            url TEXT NOT NULL CHECK(url LIKE 'http%'),
            title TEXT NOT NULL CHECK(length(title) <= 255),
            description TEXT,
            tags TEXT,
            is_favorite BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
  
        console.log('🔄 Creating bookmarks index...');
        await this.run(
          'CREATE INDEX IF NOT EXISTS idx_bookmark_user ON bookmarks(user_id)'
        );
        console.log('✔️ Created bookmarks table and index');
      } else {
        // Just ensure index exists
        await this.run(
          'CREATE INDEX IF NOT EXISTS idx_bookmark_user ON bookmarks(user_id)'
        );
      }
    } catch (err) {
      console.warn('⚠️ Error migrating bookmarks table:', err.message);
      throw err;
    }
  }
  ////////////////// end data migrations




// current working space//////////////////////////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////////////////////


  async checkBookmarksTable(resolve) {
    // Check if bookmarks table exists
    this.connection.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='bookmarks'",
      [],
      (err, row) => {
        if (err) {
          console.warn('⚠️ Error checking for bookmarks table:', err.message);
          resolve();
          return;
        }
  
        if (!row) {
          // Create bookmarks table
          this.connection.run(`
            CREATE TABLE bookmarks (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              url TEXT NOT NULL CHECK(url LIKE 'http%'),
              title TEXT NOT NULL CHECK(length(title) <= 255),
              description TEXT,
              tags TEXT,
              is_favorite BOOLEAN DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `, [], (createErr) => {
            if (createErr) {
              console.warn('⚠️ Failed to create bookmarks table:', createErr.message);
              resolve();
              return;
            }
            
            // Create index after table is created
            this.connection.run(
              'CREATE INDEX IF NOT EXISTS idx_bookmark_user ON bookmarks(user_id)',
              [],
              (indexErr) => {
                if (indexErr) {
                  console.warn('⚠️ Failed to create bookmarks index:', indexErr.message);
                } else {
                  console.log('✔️ Created bookmarks table and index');
                }
                resolve();
              }
            );
          });
        } else {
          // Just ensure the index exists
          this.connection.run(
            'CREATE INDEX IF NOT EXISTS idx_bookmark_user ON bookmarks(user_id)',
            [],
            (indexErr) => {
              if (indexErr) {
                console.warn('⚠️ Failed to verify bookmarks index:', indexErr.message);
              }
              resolve();
            }
          );
        }
      }
    );
  }

  async ensureConnection() {
    if (!this.isInitialized) {
      await new Promise(resolve => {
        const check = () => {
          if (this.isInitialized) resolve();
          else setTimeout(check, 100);
        };
        check();
      });
    }
  }

 // Unified query method
async query(sql, params = []) {
  await this.ensureConnection();
  return new Promise((resolve, reject) => {
    this.connection.all(sql, params, async (err, rows) => {
      if (err) {
        console.error('❌ Query failed:', err.message);
        console.log('SQL:', sql);
        
        // Handle missing table errors
        if (err.message.includes('no such table')) {
          const tableMatch = err.message.match(/no such table: (\w+)/);
          if (tableMatch) {
            console.error(`⚠️ Database schema might be outdated. Missing table: ${tableMatch[1]}`);
            try {
              await this.initializeSchema();
              console.log('🔄 Retrying query after schema update...');
              this.query(sql, params).then(resolve).catch(reject);
              return;
            } catch (migrationErr) {
              reject(migrationErr);
              return;
            }
          }
        }
        
        // Handle missing column errors
        if (err.message.includes('no such column')) {
          const columnMatch = err.message.match(/no such column: (\w+)/);
          if (columnMatch) {
            console.error(`⚠️ Database schema might be outdated. Missing column: ${columnMatch[1]}`);
            try {
              await this.migrateExistingSchema();
              console.log('🔄 Retrying query after schema migration...');
              this.query(sql, params).then(resolve).catch(reject);
              return;
            } catch (migrationErr) {
              reject(migrationErr);
              return;
            }
          }
        }
        
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

  // Alias for query (getAll)
  async getAll(sql, params = []) {
    return this.query(sql, params);
  }

  // Get single row
  async getOne(sql, params = []) {
    await this.ensureConnection();
    return new Promise((resolve, reject) => {
      this.connection.get(sql, params, (err, row) => {
        if (err) {
          console.error('❌ Query failed:', err.message);
          console.log('SQL:', sql);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // Execute write operations
  async run(sql, params = []) {
    await this.ensureConnection();
    return new Promise((resolve, reject) => {
      this.connection.run(sql, params, function(err) {
        if (err) {
          console.error('❌ Execution failed:', err.message);
          console.log('SQL:', sql);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Bookmarks-specific methods
  async addBookmark(userId, bookmarkData) {
    const { url, title, description, tags, is_favorite } = bookmarkData;
    const result = await this.run(
      `INSERT INTO bookmarks 
       (user_id, url, title, description, tags, is_favorite) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, url, title, description, JSON.stringify(tags || []), is_favorite || 0]
    );
    return result.id;
  }

  async getBookmarks(userId, options = {}) {
    const { limit = 100, offset = 0, favoriteOnly = false } = options;
    let sql = `SELECT * FROM bookmarks WHERE user_id = ?`;
    const params = [userId];

    if (favoriteOnly) {
      sql += ` AND is_favorite = 1`;
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return this.getAll(sql, params);
  }

  async updateBookmark(bookmarkId, userId, updates) {
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'tags') {
        fields.push(`${key} = ?`);
        params.push(JSON.stringify(value || []));
      } else {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) {
      return { changes: 0 };
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(bookmarkId, userId);

    const sql = `UPDATE bookmarks 
                 SET ${fields.join(', ')} 
                 WHERE id = ? AND user_id = ?`;

    return this.run(sql, params);
  }

  async deleteBookmark(bookmarkId, userId) {
    return this.run(
      `DELETE FROM bookmarks WHERE id = ? AND user_id = ?`,
      [bookmarkId, userId]
    );
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.connection.close(err => {
        if (err) {
          console.error('❌ Database shutdown error:', err.message);
          reject(err);
        } else {
          console.log('🛑 Database connection closed gracefully');
          this.isInitialized = false;
          resolve();
        }
      });
    });
  }
}

// Singleton database instance
const db = new Database();
db.connect();

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await db.close();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
});

module.exports = db;