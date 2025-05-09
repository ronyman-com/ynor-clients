document.addEventListener('DOMContentLoaded', function() {
    // Initialize bookmark functionality
    initBookmarks();
  });
  
  function initBookmarks() {
    // Bookmark card interactions
    const bookmarkCards = document.querySelectorAll('.bookmark-card');
    
    bookmarkCards.forEach(card => {
      // Add click handler for the entire card
      card.addEventListener('click', function(e) {
        // Don't navigate if clicking on an action button
        if (e.target.closest('.bookmark-actions')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        // Otherwise follow the link
        const link = this.querySelector('.bookmark-link');
        if (link) {
          window.open(link.href, '_blank');
        }
      });
  
      // Add hover effects
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-4px)';
        this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      });
  
      card.addEventListener('mouseleave', function() {
        this.style.transform = '';
        this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      });
    });
  
    // Bookmark action buttons
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const action = this.dataset.action;
        const bookmarkId = this.closest('.bookmark-card').dataset.id;
        
        if (action === 'edit') {
          handleEditBookmark(bookmarkId);
        } else if (action === 'delete') {
          handleDeleteBookmark(bookmarkId);
        }
      });
    });
  
    // Add new bookmark button
    const addBookmarkBtn = document.querySelector('.add-bookmark-btn');
    if (addBookmarkBtn) {
      addBookmarkBtn.addEventListener('click', function() {
        showBookmarkModal();
      });
    }
  }
  
  function handleEditBookmark(bookmarkId) {
    console.log('Editing bookmark:', bookmarkId);
    // In a real app, this would show an edit modal/form
    alert(`Edit bookmark ${bookmarkId} functionality would go here`);
  }
  
  function handleDeleteBookmark(bookmarkId) {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      console.log('Deleting bookmark:', bookmarkId);
      // In a real app, this would make an API call
      fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          // Remove the bookmark card from the UI
          document.querySelector(`.bookmark-card[data-id="${bookmarkId}"]`).remove();
          
          // Show message if no bookmarks left
          if (document.querySelectorAll('.bookmark-card').length === 0) {
            showNoBookmarksMessage();
          }
        } else {
          alert('Failed to delete bookmark');
        }
      })
      .catch(error => {
        console.error('Error deleting bookmark:', error);
        alert('Error deleting bookmark');
      });
    }
  }
  
  function showBookmarkModal() {
    console.log('Showing add bookmark modal');
    // In a real app, this would show a modal/form
    alert('Add new bookmark functionality would go here');
  }
  
  function showNoBookmarksMessage() {
    const bookmarksGrid = document.querySelector('.bookmarks-grid');
    if (bookmarksGrid) {
      bookmarksGrid.innerHTML = `
        <div class="no-bookmarks">
          <p>You don't have any bookmarks yet.</p>
          <button class="add-bookmark-btn">Add Your First Bookmark</button>
        </div>
      `;
      
      // Re-attach event listener to the new button
      document.querySelector('.add-bookmark-btn').addEventListener('click', showBookmarkModal);
    }
  }
  
  // Initialize any tooltips
  function initTooltips() {
    // This would initialize tooltips for the action buttons
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
      btn.addEventListener('mouseenter', function() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = this.dataset.tooltip;
        document.body.appendChild(tooltip);
        
        const rect = this.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width/2 - tooltip.offsetWidth/2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
        
        this.addEventListener('mouseleave', function() {
          tooltip.remove();
        }, { once: true });
      });
    });
  }
  
  // Call this when DOM is loaded
  initTooltips();