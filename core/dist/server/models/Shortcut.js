const db = require('./db');

class Shortcut {
  static create(shortcutData, callback) {
    db.run(
      `INSERT INTO shortcuts (
        user_id, shortcut_id, name, url, 
        icon_path, manifest, html
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        shortcutData.userId,
        shortcutData.shortcutId,
        shortcutData.name,
        shortcutData.url,
        shortcutData.iconPath,
        JSON.stringify(shortcutData.manifest),
        shortcutData.html
      ],
      function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, shortcutId: shortcutData.shortcutId });
      }
    );
  }

  static findByShortcutId(shortcutId, callback) {
    db.get(
      'SELECT * FROM shortcuts WHERE shortcut_id = ?',
      [shortcutId],
      (err, row) => {
        if (err) return callback(err);
        if (row) {
          row.manifest = JSON.parse(row.manifest);
        }
        callback(null, row);
      }
    );
  }

  static findByUserId(userId, callback) {
    db.all(
      'SELECT * FROM shortcuts WHERE user_id = ?',
      [userId],
      (err, rows) => {
        if (err) return callback(err);
        const shortcuts = rows.map(row => {
          row.manifest = JSON.parse(row.manifest);
          return row;
        });
        callback(null, shortcuts);
      }
    );
  }
}

module.exports = Shortcut;