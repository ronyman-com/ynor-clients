module.exports = {
    // Set this to false to disable auth requirements
    AUTH_REQUIRED: process.env.AUTH_REQUIRED !== 'false', // Default true
    
    // Cookie/LocalStorage names
    TOKEN_NAME: 'ynor_access_token',
    
    // Session duration (1 day)
    SESSION_DURATION: 86400 
  };