// public/js/auto-refresh.js
let lastUpdate = '';

async function checkForUpdates() {
  try {
    const response = await fetch('/contents.json?t=' + Date.now());
    const data = await response.json();
    
    if (data.lastUpdated !== lastUpdate) {
      console.log('Changes detected, reloading...');
      lastUpdate = data.lastUpdated;
      
      // Check if only CSS changed
      const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      cssLinks.forEach(link => {
        link.href = link.href.split('?')[0] + '?t=' + Date.now();
      });
      
      // Full reload if not just CSS
      setTimeout(() => window.location.reload(), 100);
    }
  } catch (error) {
    console.log('Update check failed:', error);
  }
}