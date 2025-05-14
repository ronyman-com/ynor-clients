export function initHeader(container) {
    if (!container) return;
    
    container.innerHTML = `
        <header class="main-header">
            <nav class="main-nav">
                <div class="logo">YNOR</div>
                <ul class="nav-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/browser">Browser</a></li>
                    <li><a href="/settings">Settings</a></li>
                </ul>
            </nav>
        </header>
    `;
    
    // Add interactive functionality
    container.querySelector('.nav-links').addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            console.log('Navigation:', e.target.href);
        }
    });
}