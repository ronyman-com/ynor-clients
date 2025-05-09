document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorElement = document.getElementById('loginError');
  
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const remember = document.querySelector('input[name="remember"]').checked;
  
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, remember })
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }
  
        // Store token if remember is checked
        if (remember) {
          localStorage.setItem('ynor_token', data.token);
        } else {
          sessionStorage.setItem('ynor_token', data.token);
        }
  
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } catch (error) {
        errorElement.textContent = error.message;
        console.error('Login error:', error);
      }
    });
  });