const { body, query, param, validationResult } = require('express-validator');
const config = require('../config/auth');
const db = require('../models/db');

// Define common rules as module-level constants
const commonRules = {
  email: body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .custom(async (value) => {
      if (config.AUTH_REQUIRED) {
        const user = await db.getOne('SELECT id FROM users WHERE email = ?', [value]);
        if (user) {
          throw new Error('Email already in use');
        }
      }
      return true;
    }),

  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must contain uppercase, lowercase, and numbers'),

  url: body('url')
    .isURL()
    .withMessage('Invalid URL format')
    .customSanitizer(value => {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return `https://${value}`;
      }
      return value;
    }),

  name: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2-100 characters')
};

// Main validator module
module.exports = {
  // Make commonRules available
  commonRules,

  // Validation middleware
  validate: (validations) => {
    return async (req, res, next) => {
      if (!config.AUTH_REQUIRED && req.guestMode) {
        return next();
      }

      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array().map(err => ({
          msg: err.msg,
          param: err.param,
          location: err.location
        })),
        guestMode: req.guestMode
      });
    };
  },

  // Specific validation chains
  validateShortcut: () => [
    commonRules.url,
    commonRules.name,
    body('icon')
      .optional()
      .isBase64()
      .withMessage('Icon must be valid base64')
  ],

  validateUserRegistration: () => [
    commonRules.email,
    commonRules.password,
    body('passwordConfirm')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],

  validateLogin: () => [
    commonRules.email,
    body('password').notEmpty().withMessage('Password is required')
  ],

  validateGuestShortcut: () => [
    commonRules.url,
    commonRules.name,
    body('expiresIn')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Expiration must be between 1-30 days')
      .toInt()
  ],

  // Sanitization
  sanitizeGuestInput: () => [
    body('ip').optional().isIP().withMessage('Invalid IP address'),
    body('userAgent').optional().trim().escape()
  ],

  // Param validation
  validateIdParam: (paramName = 'id') => [
    param(paramName)
      .isInt({ min: 1 })
      .withMessage('Invalid ID format')
      .toInt()
  ],

  // Query validation
  validatePagination: () => [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],

  // Custom validators
  checkOwnership: (table) => async (req, res, next) => {
    if (!config.AUTH_REQUIRED || req.guestMode) return next();
    
    const resource = await db.getOne(
      `SELECT user_id FROM ${table} WHERE id = ?`,
      [req.params.id]
    );

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (resource.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    next();
  }
};