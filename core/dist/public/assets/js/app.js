class AuthManager {
    static async init() {
      this.authEnabled = await this.checkAuthConfig();
      
      if (this.authEnabled) {
        this.currentUser = await this.getUser();
        this.showAuthUI();
      }
    }
  
    static async checkAuthConfig() {
      const response = await fetch('/api/config/auth');
      const { authRequired } = await response.json();
      return authRequired;
    }
  
    static showAuthUI() {
      if (this.authEnabled) {
        document.body.classList.add('auth-enabled');
        // Show/hide auth elements
      }
    }
  }
  
  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
    // Rest of your app initialization
  });