const jwt = require('jsonwebtoken');
const validator = require('validator');
const { promisify } = require('util');
const config = require('../routes/config'); 
const db = require('../models/db');

const middleware = {
  // Request logger middleware
  requestLogger: (req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  },

  // Error handler middleware
  errorHandler: (err, req, res, next) => {
    console.error('🔥 Error Stack:', err.stack);
    console.error('💥 Error Details:', {
      path: req.path,
      method: req.method,
      params: req.params,
      body: req.body,
      query: req.query
    });
    
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        stack: err.stack,
        fullError: err
      } : 'Something went wrong!'
    });
  },

  // Validation middleware
  validate: (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  },

  // Sanitization middleware
  sanitize: (req, res, next) => {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(validator.trim(req.body[key]));
      }
    }
    next();
  },

  /**
   * Flexible authentication middleware
   */
  flexibleAuth: async (req, res, next) => {
    try {
      // Skip auth if not required
      if (!config.AUTH_REQUIRED) {
        req.guestMode = true;
        return next();
      }

      // Get token from header or cookie
      let token;
      if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies?.[config.TOKEN_NAME]) {
        token = req.cookies[config.TOKEN_NAME];
      }

      if (token) {
        const decoded = await promisify(jwt.verify)(
          token,
          process.env.JWT_SECRET || 'your-secret-key'
        );

        const currentUser = await db.getOne(
          'SELECT id, email, role FROM users WHERE id = ?',
          [decoded.id]
        );

        if (currentUser) {
          req.user = currentUser;
        }
      }

      // Continue with guest mode if no valid user
      if (!req.user) {
        req.guestMode = true;
      }

      next();
    } catch (err) {
      // Continue as guest if auth fails
      req.guestMode = true;
      next();
    }
  },

  /**
   * Strict authentication middleware
   */
  authenticate: async (req, res, next) => {
    if (!config.AUTH_REQUIRED) return next();
    
    // First try flexible auth
    if (!req.user) {
      await middleware.flexibleAuth(req, res, () => {});
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  },

  /**
   * Restrict access to specific roles
   * @param {...string} roles - Allowed roles
   * @returns {Function} Middleware function
   */
  restrictTo: (...roles) => {
    return async (req, res, next) => {
      if (!config.AUTH_REQUIRED) return next();
      
      // Ensure user is authenticated first
      if (!req.user) {
        await middleware.flexibleAuth(req, res, () => {});
      }
      
      if (!req.user?.role) {
        return res.status(403).json({ 
          error: 'You do not have permission to perform this action'
        });
      }
  
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: `Requires ${roles.join(' or ')} role`
        });
      }
  
      next();
    };
  }
};

module.exports = middleware;