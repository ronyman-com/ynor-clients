document.addEventListener('DOMContentLoaded', function() {
    // Initialize all navigation components
    initNavigation();
});

function initNavigation() {
    // Initialize components with error handling
    try {
        initMobileMenu();
        initDropdowns();
        initSearch();
        highlightActiveLink();
        setupEventListeners();
    } catch (error) {
        console.error('Navigation initialization error:', error);
    }
}

function initMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navList = document.querySelector('.nav-list');
    
    if (!mobileMenuButton || !navList) return;

    mobileMenuButton.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        
        // Toggle menu visibility
        this.setAttribute('aria-expanded', !isExpanded);
        navList.classList.toggle('show', !isExpanded);
        document.body.style.overflow = isExpanded ? '' : 'hidden';
    });

    // Close menu when clicking on links (mobile only)
    navList.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                mobileMenuButton.setAttribute('aria-expanded', 'false');
                navList.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    });
}

function initDropdowns() {
    const dropdowns = [
        { button: document.getElementById('appMenuBtn'), menu: document.getElementById('appMenuDropdown') },
        { button: document.getElementById('settingsBtn'), menu: document.getElementById('settingsDropdown') }
    ];

    dropdowns.forEach(({button, menu}) => {
        if (!button || !menu) return;

        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = menu.classList.contains('show');
            
            // Close all dropdowns first
            closeAllDropdowns();
            
            // Toggle current dropdown
            if (!isVisible) {
                menu.classList.add('show');
                menu.setAttribute('aria-hidden', 'false');
                positionDropdown(menu);
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.web-menu-btn, .app-menu-dropdown, .settings-dropdown')) {
            closeAllDropdowns();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAllDropdowns();
    });
}

function positionDropdown(dropdown) {
    if (!dropdown.classList.contains('show')) return;
    
    const rect = dropdown.getBoundingClientRect();
    
    // Handle right-aligned dropdowns
    if (dropdown.classList.contains('settings-dropdown')) {
        dropdown.style.left = 'auto';
        dropdown.style.right = '0';
        
        if (rect.right > window.innerWidth) {
            dropdown.style.right = '0';
        }
    }
    
    // Handle overflow at bottom of viewport
    if (rect.bottom > window.innerHeight) {
        dropdown.style.top = 'auto';
        dropdown.style.bottom = '100%';
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.app-menu-dropdown, .settings-dropdown').forEach(dropdown => {
        dropdown.classList.remove('show');
        dropdown.setAttribute('aria-hidden', 'true');
    });
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchForm = document.getElementById('search-form');
    const suggestionsContainer = document.getElementById('suggestions-container');
    
    if (!searchInput || !searchForm || !suggestionsContainer) return;

    let abortController = null;

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
    });

    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length > 2) {
            fetchSuggestions(query);
        } else {
            clearSuggestions();
        }
    });

    searchInput.addEventListener('focus', function() {
        if (this.value.trim().length > 2) {
            fetchSuggestions(this.value.trim());
        }
    });

    function fetchSuggestions(query) {
        if (abortController) {
            abortController.abort();
        }
        
        abortController = new AbortController();
        
        fetch(`/api/suggestions?q=${encodeURIComponent(query)}`, {
            signal: abortController.signal
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch suggestions');
            return response.json();
        })
        .then(suggestions => {
            displaySuggestions(suggestions);
        })
        .catch(err => {
            if (err.name !== 'AbortError') {
                console.error('Error fetching suggestions:', err);
            }
        });
    }

    function displaySuggestions(suggestions) {
        suggestionsContainer.innerHTML = '';
        
        if (suggestions.length === 0) {
            suggestionsContainer.setAttribute('aria-hidden', 'true');
            searchInput.setAttribute('aria-expanded', 'false');
            return;
        }

        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.tabIndex = 0;
            item.innerHTML = `
                <i class="fas fa-search suggestion-icon"></i>
                <span>${suggestion}</span>
            `;
            
            item.addEventListener('click', () => {
                searchInput.value = suggestion;
                searchForm.dispatchEvent(new Event('submit'));
            });
            
            suggestionsContainer.appendChild(item);
        });

        suggestionsContainer.setAttribute('aria-hidden', 'false');
        searchInput.setAttribute('aria-expanded', 'true');
    }

    function clearSuggestions() {
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.setAttribute('aria-hidden', 'true');
        searchInput.setAttribute('aria-expanded', 'false');
    }

    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            clearSuggestions();
        }
    });
}

function highlightActiveLink() {
    const currentPath = window.location.pathname.split('/')[1] || 'home';
    const activeLink = document.querySelector(`.nav-link[data-nav="${currentPath}"]`);
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        link.setAttribute('aria-current', 'false');
    });
    
    if (activeLink) {
        activeLink.classList.add('active');
        activeLink.setAttribute('aria-current', 'page');
    }
}

function setupEventListeners() {
    // Window resize handler
    window.addEventListener('resize', function() {
        // Close mobile menu when resizing to desktop
        if (window.innerWidth > 992) {
            const mobileMenuButton = document.querySelector('.mobile-menu-button');
            const navList = document.querySelector('.nav-list');
            
            if (navList) {
                mobileMenuButton?.setAttribute('aria-expanded', 'false');
                navList.classList.remove('show');
                document.body.style.overflow = '';
            }
        }
        
        // Reposition any visible dropdowns
        document.querySelectorAll('.app-menu-dropdown.show, .settings-dropdown.show').forEach(dropdown => {
            positionDropdown(dropdown);
        });
    });
    
    // Update active link when navigating
    window.addEventListener('pushstate', highlightActiveLink);
    window.addEventListener('popstate', highlightActiveLink);
}