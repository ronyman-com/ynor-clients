// src/browsers/layouts/index.js
export async function initializeApp() {
    // Dynamic imports for better code splitting
    const { initHeader } = await import('./pages/header/menu.js');
    const { initFooter } = await import('./pages/footer/menu.js');
    const { initLeftSidebar } = await import('./pages/sidebar/L-sidebar.js');
    const { initRightSidebar } = await import('./pages/sidebar/R-sidebar.js');

    document.addEventListener('DOMContentLoaded', () => {
        initHeader(document.getElementById('header'));
        initFooter(document.getElementById('footer'));
        initLeftSidebar(document.getElementById('left-sidebar'));
        initRightSidebar(document.getElementById('right-sidebar'));
        
        console.log('Application initialized');
    });
}

// Auto-initialize
initializeApp();