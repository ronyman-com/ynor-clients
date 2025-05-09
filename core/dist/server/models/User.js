const db = require('./db');
const bcrypt = require('bcryptjs');

class User {
  static findByEmail(email, callback) {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return callback(err);
      callback(null, row);
    });
  }

  static create(user, callback) {
    bcrypt.hash(user.password, 10, (err, hash) => {
      if (err) return callback(err);
      
      db.run(
        'INSERT INTO users (email, password) VALUES (?, ?)',
        [user.email, hash],
        function(err) {
          if (err) return callback(err);
          callback(null, { id: this.lastID, email: user.email });
        }
      );
    });
  }

  static comparePassword(candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
      if (err) return callback(err);
      callback(null, isMatch);
    });
  }
}

module.exports = User;