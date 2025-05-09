document.addEventListener('DOMContentLoaded', () => {
    // Perform logout immediately
    const logout = async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'same-origin'
        });
        
        // Clear client-side tokens
        localStorage.removeItem('ynor_token');
        sessionStorage.removeItem('ynor_token');
        
        // Redirect to login after animation completes
        setTimeout(() => {
          window.location.href = '/login?loggedout=true';
        }, 2000);
      } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/login';
      }
    };
  
    logout();
  });