const db = require('./db');

class Profile {
  static findByUserId(userId, callback) {
    db.get(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId],
      (err, row) => {
        if (err) return callback(err);
        if (row && row.settings) {
          try {
            row.settings = JSON.parse(row.settings);
          } catch (e) {
            console.error('Error parsing profile settings', e);
            row.settings = {};
          }
        }
        callback(null, row);
      }
    );
  }

  static createOrUpdate(profileData, callback) {
    const settings = JSON.stringify(profileData.settings || {});
    
    db.run(
      `INSERT INTO profiles (user_id, name, avatar_path, settings)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         name = excluded.name,
         avatar_path = excluded.avatar_path,
         settings = excluded.settings`,
      [
        profileData.userId,
        profileData.name,
        profileData.avatarPath,
        settings
      ],
      function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID });
      }
    );
  }

  static updateAvatar(userId, avatarPath, callback) {
    db.run(
      'UPDATE profiles SET avatar_path = ? WHERE user_id = ?',
      [avatarPath, userId],
      function(err) {
        if (err) return callback(err);
        callback(null, { changes: this.changes });
      }
    );
  }
}

module.exports = Profile;