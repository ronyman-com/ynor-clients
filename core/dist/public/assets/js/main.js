import { loadTemplate, renderTemplate } from './utils.js';
import { AuthService } from './services/auth.js';
import { ShortcutService } from './services/shortcut.js';
import { Router } from './router.js';


// Initialize services
const authService = new AuthService();
const shortcutService = new ShortcutService();

// DOM Elements
const appContainer = document.getElementById('app');
const dashboardContainer = document.getElementById('dashboard-container');
const shortcutContainer = document.getElementById('shortcut-container');

// State
let currentUser = null;

// Initialize App
async function initApp() {
  // Check authentication
  currentUser = await authService.checkAuth();
  
  if (!currentUser) {
    window.location.href = '/login.html';
    return;
  }

  // Load dashboard
  await loadDashboard();
}

// Load Dashboard
async function loadDashboard() {
  const template = await loadTemplate('/templates/inl/dashboard.html');
  dashboardContainer.innerHTML = template;
  
  // Load user shortcuts
  const shortcuts = await shortcutService.getUserShortcuts(currentUser.id);
  renderShortcuts(shortcuts);

  // Setup event listeners
  setupDashboardListeners();
}

// Setup Dashboard Event Listeners
function setupDashboardListeners() {
  // Create Shortcut Button
  document.getElementById('create-shortcut-btn')?.addEventListener('click', () => {
    document.getElementById('shortcut-form').style.display = 'block';
  });

  // Cancel Button
  document.getElementById('cancel-btn')?.addEventListener('click', () => {
    document.getElementById('shortcut-form').style.display = 'none';
  });

  // Shortcut Form Submission
  document.getElementById('shortcut-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const newShortcut = await shortcutService.createShortcut(formData);
      await loadDashboard(); // Refresh the dashboard
    } catch (error) {
      console.error('Error creating shortcut:', error);
      alert('Failed to create shortcut');
    }
  });

  // Icon Preview
  document.getElementById('icon')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = document.getElementById('icon-preview');
        preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });
}

// Render Shortcuts
function renderShortcuts(shortcuts) {
  const grid = document.querySelector('.shortcuts-grid');
  if (!grid) return;

  grid.innerHTML = shortcuts.map(shortcut => `
    <div class="shortcut-card" data-id="${shortcut.shortcut_id}">
      <img src="${shortcut.icon_path}" alt="${shortcut.name}" width="40" height="40">
      <h3>${shortcut.name}</h3>
      <p class="shortcut-url">${new URL(shortcut.url).hostname}</p>
      <button class="btn-secondary view-shortcut">View</button>
    </div>
  `).join('');

  // Add event listeners to view buttons
  document.querySelectorAll('.view-shortcut').forEach(button => {
    button.addEventListener('click', async (e) => {
      const shortcutId = e.target.closest('.shortcut-card').dataset.id;
      await loadShortcutView(shortcutId);
    });
  });
}

// Load Shortcut View
async function loadShortcutView(shortcutId) {
  const shortcut = await shortcutService.getShortcut(shortcutId);
  if (!shortcut) return;

  const template = await loadTemplate('/templates/inl/shortcut.html');
  shortcutContainer.innerHTML = renderTemplate(template, {
    ...shortcut,
    createdAt: new Date(shortcut.created_at).toLocaleDateString()
  });

  // Setup event listeners for shortcut view
  setupShortcutViewListeners(shortcutId);
}

// Setup Shortcut View Event Listeners
function setupShortcutViewListeners(shortcutId) {
  document.getElementById('edit-shortcut')?.addEventListener('click', () => {
    // TODO: Implement edit functionality
    alert('Edit functionality coming soon!');
  });

  document.getElementById('delete-shortcut')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this shortcut?')) {
      try {
        await shortcutService.deleteShortcut(shortcutId);
        shortcutContainer.innerHTML = '';
        await loadDashboard(); // Refresh the dashboard
      } catch (error) {
        console.error('Error deleting shortcut:', error);
        alert('Failed to delete shortcut');
      }
    }
  });
}




class App {
  constructor() {
    this.authService = new AuthService();
    this.shortcutService = new ShortcutService();
    this.router = new Router(this);
    this.currentUser = null;
    
    this.init();
  }

  async init() {
    await this.checkAuth();
    this.router.handleRoute();
    this.setupEventListeners();
  }

  async checkAuth() {
    this.currentUser = await this.authService.checkAuth();
    this.updateUI();
  }

  updateUI() {
    const authControls = document.getElementById('auth-controls');
    if (this.currentUser) {
      authControls.innerHTML = `
        <span>Welcome, ${this.currentUser.email}</span>
        <button id="logout-btn" class="btn">Logout</button>
      `;
    } else {
      authControls.innerHTML = `
        <button id="login-btn" class="btn">Login</button>
        <button id="register-btn" class="btn">Register</button>
      `;
    }
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.id === 'logout-btn') this.handleLogout();
      if (e.target.id === 'login-btn') this.router.navigate('/login');
      if (e.target.id === 'register-btn') this.router.navigate('/register');
    });
  }

  async handleLogout() {
    await this.authService.logout();
    this.currentUser = null;
    this.updateUI();
    this.router.navigate('/');
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => new App());

