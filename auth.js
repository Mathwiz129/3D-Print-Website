// Firebase Authentication System
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be loaded
    if (typeof FirebaseAuth === 'undefined') {
        // Listen for Firebase ready event
        window.addEventListener('firebaseReady', initializeAuth);
        window.addEventListener('firebaseError', (event) => {
            console.error('Firebase initialization failed:', event.detail);
        });
        return;
    }
    
    // Firebase is already loaded, initialize immediately
    initializeAuth();
});

function initializeAuth() {
    // Wait for Firebase to be loaded
    if (typeof FirebaseAuth === 'undefined') {
        console.error('Firebase not loaded. Make sure firebase-config.js is included.');
        return;
    }

    const { auth, onAuthStateChanged } = FirebaseAuth;
    
    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log('User is signed in:', user.email);
            updateNavigationForLoggedInUser({
                email: user.email,
                username: user.displayName || user.email.split('@')[0],
                uid: user.uid
            });
            
            // Redirect if on auth pages
            const currentPage = window.location.pathname;
            if (currentPage.includes('login.html') || currentPage.includes('signup.html')) {
                window.location.href = 'index.html';
            }
        } else {
            // User is signed out
            console.log('User is signed out');
            updateNavigationForLoggedOutUser();
        }
    });
    
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
        const { auth, signInWithEmailAndPassword } = FirebaseAuth;
        
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('Login successful for user:', user.email);
        showMessage('Login successful! Redirecting...', 'success');
        
        // Wait a moment for the auth state to update
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
        }
        
        showMessage(errorMessage, 'error');
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
        const { auth, createUserWithEmailAndPassword } = FirebaseAuth;
        const { db, doc, setDoc, collection, query, where, getDocs } = FirebaseDB;
        
        console.log('Starting signup process...');
        
        // Check if username already exists
        console.log('Checking if username exists...');
        const usernameQuery = query(collection(db, 'users'), where('username', '==', username));
        const usernameSnapshot = await getDocs(usernameQuery);
        
        if (!usernameSnapshot.empty) {
            showMessage('Username already exists. Please choose a different username.', 'error');
            button.innerHTML = originalText;
            button.disabled = false;
            return;
        }
        
        console.log('Username is available, creating Firebase Auth user...');
        
        // Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('Firebase Auth user created:', user.uid);
        
        // Create user profile in Firestore
        console.log('Creating user profile in Firestore...');
        const userProfile = {
            email: email,
            username: username,
            createdAt: new Date().toISOString(), // Use ISO string for Firestore
            role: 'customer',
            profile: {
                displayName: username,
                bio: '',
                location: '',
                phone: ''
            }
        };
        
        console.log('User profile data:', userProfile);
        console.log('Attempting to write to Firestore...');
        
        // Try to create the user document in Firestore
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, userProfile);
            console.log('✅ User profile created successfully in Firestore');
        } catch (firestoreError) {
            console.error('❌ Firestore error:', firestoreError);
            console.error('Firestore error code:', firestoreError.code);
            console.error('Firestore error message:', firestoreError.message);
            
            // Show specific error message
            if (firestoreError.code === 'permission-denied') {
                showMessage('Database permission denied. Please check Firestore rules.', 'error');
            } else {
                showMessage(`Database error: ${firestoreError.message}`, 'error');
            }
            
            button.innerHTML = originalText;
            button.disabled = false;
            return;
        }
        
        showMessage('Account created successfully! Logging you in...', 'success');
        
        // Wait a moment for the auth state to update
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Signup failed. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please choose a stronger password.';
                break;
            case 'permission-denied':
                errorMessage = 'Database permission denied. Please try again or contact support.';
                break;
            default:
                errorMessage = `Signup failed: ${error.message}`;
        }
        
        showMessage(errorMessage, 'error');
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
async function logout() {
    try {
        const { auth, signOut } = FirebaseAuth;
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout by clearing any local data
        window.location.href = 'index.html';
    }
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