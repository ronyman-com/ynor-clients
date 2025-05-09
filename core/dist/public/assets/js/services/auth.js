export class AuthService {
    async checkAuth() {
      const token = localStorage.getItem('ynor_token');
      if (!token) return null;
  
      try {
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch (error) {
        console.error('Auth verification error:', error);
        return null;
      }
    }
  
    async login(email, password) {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
  
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('ynor_token', data.token);
        return data.user;
      }
      throw new Error('Login failed');
    }
  
    logout() {
      localStorage.removeItem('ynor_token');
    }
  }