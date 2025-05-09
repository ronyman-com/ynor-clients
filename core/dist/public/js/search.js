class YnorSearch {
    constructor() {
      this.searchForm = document.getElementById('search-form');
      this.searchInput = document.getElementById('omnibox');
      this.resultsContainer = document.getElementById('search-results');
      this.suggestionsContainer = document.getElementById('suggestions-container');
      this.searchTabs = document.getElementById('search-tabs');
      this.userId = localStorage.getItem('ynor-user-id') || `user-${Math.random().toString(36).substr(2, 9)}`;
      
      this.init();
    }
  
    init() {
      // Unified search/address bar
      this.searchInput.addEventListener('input', this.handleInput.bind(this));
      this.searchForm.addEventListener('submit', this.handleSubmit.bind(this));
      
      // Initialize UI
      this.initSearchTabs();
      this.initPrivacyControls();
      this.initViewModes();
      
      // Load user preferences
      this.loadPreferences();
    }
  
    async handleInput(e) {
      const query = e.target.value.trim();
      
      // Detect URLs
      if (this.isPotentialUrl(query)) {
        this.showUrlSuggestions(query);
        return;
      }
      
      // Show search suggestions
      if (query.length > 2) {
        const suggestions = await this.fetchSuggestions(query);
        this.showSuggestions(suggestions);
      } else {
        this.suggestionsContainer.innerHTML = '';
      }
      
      // Show search operators
      this.showSearchOperators(query);
    }
  
    async handleSubmit(e) {
      e.preventDefault();
      const query = this.searchInput.value.trim();
      
      if (this.isPotentialUrl(query)) {
        window.location.href = this.addHttpIfNeeded(query);
        return;
      }
      
      this.performSearch(query);
    }
  
    // ... (previous search methods remain) ...
    

  
    async fetchSuggestions(query) {
      try {
        const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}&userId=${this.userId}`);
        return await response.json();
      } catch (error) {
        return [];
      }
    }
  
    showSuggestions(suggestions) {
      this.suggestionsContainer.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" data-query="${suggestion}">
          ${suggestion}
        </div>
      `).join('');
      
      // Add click handlers
      document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          this.searchInput.value = item.dataset.query;
          this.performSearch(item.dataset.query);
        });
      });
    }
  
    showSearchOperators(query) {
      // Detect if query contains an operator
      const hasOperator = Object.keys(CONFIG.OPERATORS).some(op => query.includes(`${op}:`));
      
      if (hasOperator) {
        // Show operator help
      } else {
        // Show operator suggestions
      }
    }
  
    initSearchTabs() {
      const tabs = ['Web', 'Images', 'Videos', 'News', 'Maps'];
      this.searchTabs.innerHTML = tabs.map(tab => `
        <button class="search-tab" data-type="${tab.toLowerCase()}">
          ${tab}
        </button>
      `).join('');
      
      // Add tab click handlers
      document.querySelectorAll('.search-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          this.switchTab(tab.dataset.type);
        });
      });
    }
  
    switchTab(tabType) {
      // Update active tab
      document.querySelectorAll('.search-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.type === tabType);
      });
      
      // Load results for this tab type
      this.loadTabResults(tabType);
    }
  
    initPrivacyControls() {
      const privacyToggle = document.getElementById('privacy-toggle');
      const clearHistoryBtn = document.getElementById('clear-history');
      
      privacyToggle.addEventListener('change', (e) => {
        this.setPrivacyMode(e.target.checked);
      });
      
      clearHistoryBtn.addEventListener('click', () => {
        this.clearSearchHistory();
      });
    }
  
    initViewModes() {
      const gridViewBtn = document.getElementById('view-grid');
      const listViewBtn = document.getElementById('view-list');
      
      gridViewBtn.addEventListener('click', () => {
        this.resultsContainer.classList.add('grid-view');
        this.resultsContainer.classList.remove('list-view');
      });
      
      listViewBtn.addEventListener('click', () => {
        this.resultsContainer.classList.add('list-view');
        this.resultsContainer.classList.remove('grid-view');
      });
    }
  
    isPotentialUrl(input) {
      try {
        new URL(input);
        return true;
      } catch {
        return input.includes('.') && 
               !input.includes(' ') && 
               input.length > 4;
      }
    }
  
    addHttpIfNeeded(url) {
      return !url.startsWith('http') ? `https://${url}` : url;
    }
  
    // ... other methods ...
  }
  
  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    window.ynorSearch = new YnorSearch();
  });