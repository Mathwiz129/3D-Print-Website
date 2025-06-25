// Node.js API Authentication System
const API_BASE_URL = 'http://localhost:3000/api'; // Change this to your deployed URL

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Handle signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});

// Check if user is already logged in
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        // Verify token is still valid
        verifyToken(token).then(isValid => {
            if (isValid) {
                // User is logged in, redirect to home if on auth pages
                const currentPage = window.location.pathname;
                if (currentPage.includes('login.html') || currentPage.includes('signup.html')) {
                    window.location.href = 'index.html';
                }
                
                // Update navigation to show user info
                updateNavigationForLoggedInUser(JSON.parse(user));
            } else {
                // Token is invalid, clear storage
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                updateNavigationForLoggedOutUser();
            }
        }).catch(() => {
            // Error verifying token, clear storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            updateNavigationForLoggedOutUser();
        });
    }
}

// Verify JWT token with backend
async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember');
    
    // Clear any existing messages
    clearMessages();
    
    // Basic validation
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    const button = document.querySelector('.auth-button');
    const originalText = button.innerHTML;
    
    // Show loading state
    button.innerHTML = '<span class="material-icons">hourglass_empty</span> Logging in...';
    button.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store auth data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (remember) {
                localStorage.setItem('rememberMe', 'true');
            }
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showMessage(data.error || 'Login failed', 'error');
            button.innerHTML = originalText;
            button.disabled = false;
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please try again.', 'error');
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const username = formData.get('username');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const terms = formData.get('terms');
    
    // Clear any existing messages
    clearMessages();
    
    // Basic validation
    if (!email || !username || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (username.length < 3) {
        showMessage('Username must be at least 3 characters long', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (!terms) {
        showMessage('Please agree to the Terms of Service and Privacy Policy', 'error');
        return;
    }
    
    const button = document.querySelector('.auth-button');
    const originalText = button.innerHTML;
    
    // Show loading state
    button.innerHTML = '<span class="material-icons">hourglass_empty</span> Creating account...';
    button.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store auth data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showMessage('Account created successfully! Logging you in...', 'success');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showMessage(data.error || 'Signup failed', 'error');
            button.innerHTML = originalText;
            button.disabled = false;
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showMessage('Network error. Please try again.', 'error');
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Update navigation for logged in user
function updateNavigationForLoggedInUser(user) {
    const navRight = document.querySelector('.nav-right');
    if (navRight) {
        navRight.innerHTML = `
            <a href="#"><i class="material-icons">search</i></a>
            <span class="username">${user.username}</span>
            <a href="#" onclick="logout()" class="logout-link">Logout</a>
        `;
    }
}

// Update navigation for logged out user
function updateNavigationForLoggedOutUser() {
    const navRight = document.querySelector('.nav-right');
    if (navRight) {
        navRight.innerHTML = `
            <a href="#"><i class="material-icons">search</i></a>
            <a href="login.html">Log In</a>
        `;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    window.location.href = 'index.html';
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(message, type) {
    const form = document.querySelector('.auth-form');
    if (!form) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    form.insertBefore(messageDiv, form.firstChild);
}

function clearMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => message.remove());
}

// Add logout function to global scope
window.logout = logout; 