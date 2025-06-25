// Navigation Component Loader
document.addEventListener('DOMContentLoaded', function() {
    // Create a placeholder for the navigation
    const navPlaceholder = document.getElementById('nav-placeholder');
    
    if (navPlaceholder) {
        // Load the navigation component
        fetch('nav.html')
            .then(response => response.text())
            .then(html => {
                // Insert the navigation HTML
                navPlaceholder.innerHTML = html;
                
                // Highlight the current page in navigation
                highlightCurrentPage();
                
                // Check Firebase auth status if Firebase is loaded
                if (typeof FirebaseAuth !== 'undefined') {
                    checkFirebaseAuthStatus();
                } else {
                    // If Firebase isn't loaded yet, wait a bit and try again
                    setTimeout(() => {
                        if (typeof FirebaseAuth !== 'undefined') {
                            checkFirebaseAuthStatus();
                        }
                    }, 1000);
                }
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
                // Fallback navigation if nav.html fails to load
                navPlaceholder.innerHTML = `
                    <nav class="main-nav">
                        <div class="nav-left">
                            <a href="index.html" class="logo">OUTPRINT</a>
                        </div>
                        <div class="nav-center">
                            <ul class="nav-menu">
                                <li><a href="about.html">About</a></li>
                                <li><a href="apply.html">Join</a></li>
                                <li><a href="orders.html">Order</a></li>
                            </ul>
                        </div>
                        <div class="nav-right">
                            <a href="account.html" class="account-link"><i class="material-icons">account_circle</i></a>
                            <div class="auth-section">
                                <a href="login.html" class="login-link">Log In</a>
                            </div>
                        </div>
                    </nav>
                `;
                highlightCurrentPage();
            });
    }
});

// Function to highlight the current page in navigation
function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-center a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.style.color = '#c55020'; // Darker orange for current page
            link.style.fontWeight = 'bold';
        }
    });
}

// Function to check Firebase authentication status
function checkFirebaseAuthStatus() {
    const { auth, onAuthStateChanged } = FirebaseAuth;
    
    // Set up the auth state listener
    onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
        
        if (user) {
            // User is signed in
            console.log('Navigation: User is signed in:', user.email);
            
            // Check if we're on an auth page and redirect if needed
            const currentPage = window.location.pathname;
            if (currentPage.includes('login.html') || currentPage.includes('signup.html')) {
                console.log('Redirecting from auth page to home...');
                window.location.href = 'index.html';
                return;
            }
            
            // Try to get username from Firestore or use email
            getUserProfile(user.uid).then(profile => {
                const username = profile?.username || user.email.split('@')[0];
                updateNavigationForLoggedInUser({
                    email: user.email,
                    username: username,
                    uid: user.uid
                });
            }).catch(() => {
                // If we can't get profile, use email
                updateNavigationForLoggedInUser({
                    email: user.email,
                    username: user.email.split('@')[0],
                    uid: user.uid
                });
            });
        } else {
            // User is signed out
            console.log('Navigation: User is signed out');
            updateNavigationForLoggedOutUser();
        }
    });
}

// Function to get user profile from Firestore
async function getUserProfile(userId) {
    try {
        const { db, doc, getDoc } = FirebaseDB;
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Navigation: Firestore data:', userData);
            // Return display name if available, otherwise username, otherwise email prefix
            const displayName = userData.profile?.displayName || userData.username || userData.email.split('@')[0];
            console.log('Navigation: Using display name:', displayName);
            return {
                username: displayName,
                email: userData.email
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

// Function to update navigation for logged in user
function updateNavigationForLoggedInUser(user) {
    console.log('Updating navigation for logged in user:', user.username);
    const navRight = document.querySelector('.nav-right');
    if (navRight) {
        navRight.innerHTML = `
            <a href="account.html" class="account-link"><i class="material-icons">account_circle</i></a>
            <div class="auth-section">
                <a href="account.html" class="username-link"><span class="username">${user.username}</span></a>
                <a href="#" onclick="logout()" class="logout-link">Logout</a>
            </div>
        `;
        console.log('Navigation updated for logged in user');
    } else {
        console.error('nav-right element not found');
    }
}

// Function to update navigation for logged out user
function updateNavigationForLoggedOutUser() {
    console.log('Updating navigation for logged out user');
    const navRight = document.querySelector('.nav-right');
    if (navRight) {
        navRight.innerHTML = `
            <a href="account.html" class="account-link"><i class="material-icons">account_circle</i></a>
            <div class="auth-section">
                <a href="login.html" class="login-link">Log In</a>
            </div>
        `;
        console.log('Navigation updated for logged out user');
    } else {
        console.error('nav-right element not found');
    }
}

// Logout function
async function logout() {
    console.log('Logout function called');
    try {
        if (typeof FirebaseAuth !== 'undefined') {
            const { auth, signOut } = FirebaseAuth;
            await signOut(auth);
            console.log('User signed out successfully');
        }
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout by redirecting
        window.location.href = 'index.html';
    }
}

// Add logout function to global scope
window.logout = logout;

// Function to force refresh navigation (available globally)
window.refreshNavigation = function() {
    console.log('Forcing navigation refresh...');
    if (typeof FirebaseAuth !== 'undefined') {
        checkFirebaseAuthStatus();
    }
}; 