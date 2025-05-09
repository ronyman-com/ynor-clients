export class Router {
    constructor(app) {
      this.app = app;
      this.routes = {
        '/': this.homeRoute.bind(this),
        '/login': this.loginRoute.bind(this),
        '/register': this.registerRoute.bind(this),
        '/shortcuts': this.shortcutsRoute.bind(this),
        '/shortcuts/new': this.newShortcutRoute.bind(this)
      };
    }
  
    handleRoute() {
      const path = window.location.pathname;
      const handler = this.routes[path] || this.notFoundRoute.bind(this);
      handler();
    }
  
    navigate(path) {
      window.history.pushState({}, '', path);
      this.handleRoute();
    }
  
    async homeRoute() {
      document.getElementById('content').innerHTML = `
        <h2>Welcome to YNOR Browser</h2>
        <p>Create web shortcuts that work across all devices</p>
        ${this.app.currentUser ? 
          `<a href="/shortcuts" class="btn">View Your Shortcuts</a>` : 
          `<div class="auth-actions">
            <button id="home-login" class="btn">Login</button>
            <button id="home-register" class="btn">Register</button>
          </div>`
        }
      `;
    }
  
    // Implement other routes similarly
  }