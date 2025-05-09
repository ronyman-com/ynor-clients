document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-button');
    
    if (searchInput && searchButton) {
      searchButton.addEventListener('click', performSearch);
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
      });
    }
  
    function performSearch() {
      const query = searchInput.value.trim();
      if (query) {
        // Replace with your actual search endpoint
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
      }
    }
  
    // Category card animations
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transition = 'transform 0.3s ease';
      });
    });
  
    // Load more trending items (example)
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.className = 'load-more';
    loadMoreBtn.style.display = 'none'; // Hide initially
    
    const trendingGrid = document.querySelector('.trending-grid');
    if (trendingGrid) {
      trendingGrid.appendChild(loadMoreBtn);
      
      // Simulate loading more items
      loadMoreBtn.addEventListener('click', function() {
        // In a real app, this would fetch more data from an API
        console.log('Loading more trending items...');
      });
      
      // Show button if there are more items to load
      // You would replace this with actual logic
      if (/* condition for more items */ false) {
        loadMoreBtn.style.display = 'block';
      }
    }
  });