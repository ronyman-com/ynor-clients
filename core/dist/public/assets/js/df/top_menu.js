document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initTopMenu();
});

function initTopMenu() {
    try {
        initDropdowns();
        initNavigationButtons();
        initSearch();
        setupEventListeners();
    } catch (error) {
        console.error('Top menu initialization error:', error);
    }
}

function initDropdowns() {
    const dropdowns = [
        { 
            button: document.getElementById('appMenuBtn'),
            menu: document.getElementById('appMenuDropdown'),
            position: 'left'
        },
        { 
            button: document.getElementById('settingsBtn'),
            menu: document.getElementById('settingsDropdown'),
            position: 'right'
        }
    ];

    dropdowns.forEach(({button, menu, position}) => {
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
                button.setAttribute('aria-expanded', 'true');
                positionDropdown(menu, position);
            } else {
                button.setAttribute('aria-expanded', 'false');
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
        if (e.key === 'Escape') {
            closeAllDropdowns();
        }
    });
}

function positionDropdown(dropdown, position) {
    if (!dropdown.classList.contains('show')) return;
    
    const rect = dropdown.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Position based on specified alignment
    if (position === 'right') {
        dropdown.style.left = 'auto';
        dropdown.style.right = '0';
        
        // Adjust if goes off screen
        if (rect.right > viewportWidth) {
            dropdown.style.right = '0';
            dropdown.style.left = 'auto';
        }
    } else {
        dropdown.style.right = 'auto';
        dropdown.style.left = '0';
    }
    
    // Handle vertical overflow
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
    
    document.querySelectorAll('.web-menu-btn').forEach(button => {
        button.setAttribute('aria-expanded', 'false');
    });
}

function initNavigationButtons() {
    const backBtn = document.querySelector('.back-btn');
    const forwardBtn = document.querySelector('.forward-btn');
    const refreshBtn = document.querySelector('.refresh-btn');
    
    if (backBtn) backBtn.addEventListener('click', () => window.history.back());
    if (forwardBtn) forwardBtn.addEventListener('click', () => window.history.forward());
    if (refreshBtn) refreshBtn.addEventListener('click', () => window.location.reload());
    
    // Update button states
    window.addEventListener('popstate', updateNavButtons);
    updateNavButtons();
    
    function updateNavButtons() {
        if (backBtn) backBtn.disabled = window.history.state?.index === 0;
        if (forwardBtn) forwardBtn.disabled = !window.history.state?.forwardAvailable;
    }
}

function initSearch() {
    const urlInput = document.querySelector('.web-url-input');
    const searchButton = document.getElementById('searchButton');
    
    if (!urlInput || !searchButton) return;
    
    // Handle Enter key in input
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            navigateToUrl();
        }
    });
    
    // Handle search button click
    searchButton.addEventListener('click', navigateToUrl);
    
    function navigateToUrl() {
        let url = urlInput.value.trim();
        
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            // Check if it's a domain (contains dot) or search query
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                // Treat as search query
                url = `https://search.example.com/search?q=${encodeURIComponent(url)}`;
            }
        }
        
        window.location.href = url;
    }
}

function setupEventListeners() {
    // Language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const selectedLang = this.value;
            // Implement language change logic here
            console.log('Language changed to:', selectedLang);
        });
    }
    
    // Region selector
    const regionSelect = document.getElementById('regionSelect');
    if (regionSelect) {
        regionSelect.addEventListener('change', function() {
            const selectedRegion = this.value;
            // Implement region change logic here
            console.log('Region changed to:', selectedRegion);
        });
    }
    
    // Tracking protection toggle
    const trackingToggle = document.getElementById('trackingProtectionToggle');
    if (trackingToggle) {
        trackingToggle.addEventListener('change', function() {
            console.log('Tracking protection:', this.checked ? 'ON' : 'OFF');
        });
    }
    
    // Clear data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all browsing data?')) {
                console.log('Clearing browsing data...');
                // Implement clear data functionality
            }
        });
    }
    
    // Help button
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', function() {
            window.open('/help', '_blank');
        });
    }
    
    // Sign out button
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to sign out?')) {
                console.log('Signing out...');
                // Implement sign out functionality
                window.location.href = '/logout';
            }
        });
    }
}

// Handle window resize to reposition dropdowns
window.addEventListener('resize', function() {
    const appMenu = document.getElementById('appMenuDropdown');
    const settingsMenu = document.getElementById('settingsDropdown');
    
    if (appMenu && appMenu.classList.contains('show')) {
        positionDropdown(appMenu, 'left');
    }
    
    if (settingsMenu && settingsMenu.classList.contains('show')) {
        positionDropdown(settingsMenu, 'right');
    }
});