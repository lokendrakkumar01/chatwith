// API Base URL
const API_BASE = window.location.origin;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// Toggle between login and signup forms
showSignupLink?.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.classList.remove('active');
      signupForm.classList.add('active');
      loginError.classList.remove('show');
      loginError.textContent = '';
});

showLoginLink?.addEventListener('click', (e) => {
      e.preventDefault();
      signupForm.classList.remove('active');
      loginForm.classList.add('active');
      signupError.classList.remove('show');
      signupError.textContent = '';
});

// Check if already logged in
if (localStorage.getItem('token')) {
      window.location.href = '/chat';
}

// Handle Login
loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      // Clear previous errors
      loginError.textContent = '';
      loginError.classList.remove('show');

      // Validation
      if (!email || !password) {
            showError(loginError, 'Please fill in all fields');
            return;
      }

      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                  // Store token and user info
                  localStorage.setItem('token', data.token);
                  localStorage.setItem('user', JSON.stringify(data.user));

                  // Redirect to chat
                  window.location.href = '/chat';
            } else {
                  showError(loginError, data.message || 'Login failed');
            }
      } catch (error) {
            console.error('Login error:', error);
            showError(loginError, 'Network error. Please try again.');
      } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
      }
});

// Handle Signup
signupForm?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('signupUsername').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;

      // Clear previous errors
      signupError.textContent = '';
      signupError.classList.remove('show');

      // Validation
      if (!username || !email || !password) {
            showError(signupError, 'Please fill in all fields');
            return;
      }

      if (username.length < 3) {
            showError(signupError, 'Username must be at least 3 characters');
            return;
      }

      if (password.length < 6) {
            showError(signupError, 'Password must be at least 6 characters');
            return;
      }

      // Show loading state
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
            const response = await fetch(`${API_BASE}/api/auth/signup`, {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (data.success) {
                  // Store token and user info
                  localStorage.setItem('token', data.token);
                  localStorage.setItem('user', JSON.stringify(data.user));

                  // Redirect to chat
                  window.location.href = '/chat';
            } else {
                  // Handle validation errors
                  if (data.errors && data.errors.length > 0) {
                        showError(signupError, data.errors[0].msg);
                  } else {
                        showError(signupError, data.message || 'Signup failed');
                  }
            }
      } catch (error) {
            console.error('Signup error:', error);
            showError(signupError, 'Network error. Please try again.');
      } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
      }
});

// Helper function to show errors
function showError(errorElement, message) {
      errorElement.textContent = message;
      errorElement.classList.add('show');
}
