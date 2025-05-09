module.exports = {
    database: {
      connection: {
        code: 'DB_CONN_ERR',
        message: 'Database connection failed',
        status: 500
      },
      query: {
        code: 'DB_QUERY_ERR', 
        message: 'Database query failed',
        status: 500
      }
    },
    auth: {
      invalid_credentials: {
        code: 'AUTH_ERR_401',
        message: 'Invalid email or password',
        status: 401
      }
    }
    // Add more error types...
  };