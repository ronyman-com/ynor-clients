document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const errorElement = document.getElementById('signupError');
  
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
  
      if (password !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match';
        return;
      }
  
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }
  
        // Redirect to login with success message
        window.location.href = '/login?registered=true';
      } catch (error) {
        errorElement.textContent = error.message;
        console.error('Registration error:', error);
      }
    });
  });