// Common functionality for both pages
function setupSearch(selector = '.search-container') {
    const container = document.querySelector(selector);
    if (!container) return;
  
    const input = container.querySelector('input');
    const button = container.querySelector('button');
  
    const performSearch = () => {
      const query = input.value.trim();
      if (query) {
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
      }
    };
  
    button.addEventListener('click', performSearch);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }
  
  function setupCardHoverEffects(selector = '.card') {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }
  
  // Initialize common functionality when DOM loads
  document.addEventListener('DOMContentLoaded', function() {
    setupSearch();
    setupCardHoverEffects();
  });