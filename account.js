// Account Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be loaded
    if (typeof FirebaseAuth === 'undefined') {
        console.error('Firebase not loaded. Make sure firebase-config.js is included.');
        return;
    }

    const { auth, onAuthStateChanged } = FirebaseAuth;
    
    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, load account information
            console.log('User is signed in:', user.email);
            loadAccountInformation(user);
        } else {
            // User is signed out, redirect to login
            console.log('User is signed out, redirecting to login');
            window.location.href = 'login.html';
        }
    });
});

// Load and display account information
async function loadAccountInformation(user) {
    const accountContent = document.getElementById('accountContent');
    
    try {
        // Try to get user profile from Firestore
        const { db, doc, getDoc, updateDoc } = FirebaseDB;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        let userData = {
            email: user.email,
            username: user.email.split('@')[0],
            createdAt: new Date().toISOString(),
            role: 'customer',
            profile: {
                displayName: user.email.split('@')[0],
                bio: '',
                location: '',
                phone: ''
            }
        };
        
        if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            console.log('Firestore data loaded:', firestoreData);
            // Use Firestore data if available, otherwise use defaults
            userData = {
                email: firestoreData.email || user.email,
                username: firestoreData.username || user.email.split('@')[0],
                createdAt: firestoreData.createdAt || new Date().toISOString(),
                profile: {
                    displayName: firestoreData.profile?.displayName || firestoreData.username || user.email.split('@')[0],
                    bio: firestoreData.profile?.bio || '',
                    location: firestoreData.profile?.location || '',
                    phone: firestoreData.profile?.phone || ''
                }
            };
            console.log('Final userData:', userData);
        }
        
        // Display account information
        accountContent.innerHTML = `
            <div class="account-info">
                <div class="profile-section">
                    <h3><span class="material-icons">person</span> Profile Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Email</label>
                            <p>${userData.email}</p>
                        </div>
                        <div class="info-item">
                            <label>Username</label>
                            <p>${userData.username}</p>
                        </div>
                        <div class="info-item">
                            <label>Display Name</label>
                            <p id="displayNameValue">${userData.profile?.displayName || userData.username}</p>
                        </div>
                        <div class="info-item">
                            <label>Member Since</label>
                            <p>${new Date(userData.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
                <div class="profile-section">
                    <h3><span class="material-icons">settings</span> Account Actions</h3>
                    <div class="action-buttons">
                        <button class="auth-button" id="editProfileBtn">
                            <span class="material-icons">edit</span>
                            Edit Profile
                        </button>
                        <button class="auth-button" onclick="viewOrders()">
                            <span class="material-icons">receipt</span>
                            View Orders
                        </button>
                        <button class="auth-button" onclick="viewApplications()">
                            <span class="material-icons">description</span>
                            View Applications
                        </button>
                    </div>
                </div>
            </div>
            <div id="editProfileModal" class="modal" style="display:none;">
                <div class="modal-content">
                    <span class="close" id="closeModalBtn">&times;</span>
                    <h2>Edit Profile</h2>
                    
                    <!-- Display Name Section -->
                    <div class="edit-section">
                        <h3>Change Display Name</h3>
                        <form id="editDisplayNameForm">
                            <div class="form-group">
                                <label for="displayNameInput">Display Name</label>
                                <input type="text" id="displayNameInput" name="displayName" value="${userData.profile?.displayName || userData.username}" required />
                            </div>
                            <button type="submit" class="auth-button">Update Display Name</button>
                        </form>
                    </div>
                    
                    <div class="section-divider">
                        <span>or</span>
                    </div>
                    
                    <!-- Password Section -->
                    <div class="edit-section">
                        <h3>Change Password</h3>
                        <form id="editPasswordForm">
                            <div class="form-group">
                                <label for="currentPasswordInput">Current Password</label>
                                <input type="password" id="currentPasswordInput" name="currentPassword" required />
                            </div>
                            <div class="form-group">
                                <label for="newPasswordInput">New Password</label>
                                <input type="password" id="newPasswordInput" name="newPassword" required />
                            </div>
                            <div class="form-group">
                                <label for="confirmPasswordInput">Confirm New Password</label>
                                <input type="password" id="confirmPasswordInput" name="confirmPassword" required />
                            </div>
                            <button type="submit" class="auth-button">Update Password</button>
                        </form>
                    </div>
                    
                    <div id="editProfileMessage"></div>
                </div>
            </div>
        `;
        
        // Modal logic
        const editProfileBtn = document.getElementById('editProfileBtn');
        const editProfileModal = document.getElementById('editProfileModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const editDisplayNameForm = document.getElementById('editDisplayNameForm');
        const editPasswordForm = document.getElementById('editPasswordForm');
        const editProfileMessage = document.getElementById('editProfileMessage');
        const displayNameValue = document.getElementById('displayNameValue');

        if (editProfileBtn && editProfileModal && closeModalBtn && editDisplayNameForm && editPasswordForm) {
            editProfileBtn.onclick = () => {
                editProfileModal.style.display = 'block';
                editProfileMessage.textContent = '';
            };
            closeModalBtn.onclick = () => {
                editProfileModal.style.display = 'none';
            };
            window.onclick = (event) => {
                if (event.target === editProfileModal) {
                    editProfileModal.style.display = 'none';
                }
            };
            editDisplayNameForm.onsubmit = async (e) => {
                e.preventDefault();
                editProfileMessage.textContent = '';
                const displayName = document.getElementById('displayNameInput').value.trim();
                try {
                    // Update display name in Firestore - create document if it doesn't exist
                    const { db, doc, setDoc } = FirebaseDB;
                    await setDoc(doc(db, 'users', user.uid), {
                        email: user.email,
                        username: user.email.split('@')[0],
                        createdAt: new Date().toISOString(),
                        profile: {
                            displayName: displayName
                        }
                    }, { merge: true }); // merge: true will create the document if it doesn't exist
                    
                    // Update the display on the page immediately
                    displayNameValue.textContent = displayName;
                    editProfileMessage.textContent = 'Display name updated successfully!';
                    editProfileMessage.style.color = 'green';
                    
                    // Refresh navigation to show updated display name
                    if (typeof window.refreshNavigation === 'function') {
                        window.refreshNavigation();
                    }
                    
                    setTimeout(() => {
                        editProfileModal.style.display = 'none';
                    }, 1200);
                } catch (err) {
                    console.error('Error updating display name:', err);
                    editProfileMessage.textContent = 'Error updating display name: ' + (err.message || err);
                    editProfileMessage.style.color = 'red';
                }
            };
            editPasswordForm.onsubmit = async (e) => {
                e.preventDefault();
                editProfileMessage.textContent = '';
                const currentPassword = document.getElementById('currentPasswordInput').value;
                const newPassword = document.getElementById('newPasswordInput').value;
                const confirmPassword = document.getElementById('confirmPasswordInput').value;
                if (newPassword !== confirmPassword) {
                    editProfileMessage.textContent = 'Passwords do not match';
                    editProfileMessage.style.color = 'red';
                    return;
                }
                try {
                    // Verify current password and reauthenticate
                    const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = FirebaseAuth;
                    const credential = EmailAuthProvider.credential(user.email, currentPassword);
                    await reauthenticateWithCredential(user, credential);
                    // Update password in Firebase Auth
                    await updatePassword(user, newPassword);
                    editProfileMessage.textContent = 'Password updated successfully!';
                    editProfileMessage.style.color = 'green';
                    setTimeout(() => {
                        editProfileModal.style.display = 'none';
                    }, 1200);
                } catch (err) {
                    console.error('Error updating password:', err);
                    let errorMessage = 'Error updating password';
                    if (err.code === 'auth/wrong-password') {
                        errorMessage = 'Current password is incorrect';
                    } else if (err.code === 'auth/weak-password') {
                        errorMessage = 'New password is too weak';
                    } else {
                        errorMessage += ': ' + (err.message || err);
                    }
                    editProfileMessage.textContent = errorMessage;
                    editProfileMessage.style.color = 'red';
                }
            };
        }
        
    } catch (error) {
        console.error('Error loading account information:', error);
        accountContent.innerHTML = `
            <div class="error-message">
                <span class="material-icons">error</span>
                <p>Error loading account information. Please try again.</p>
            </div>
        `;
    }
}

// Placeholder functions for account actions
function editProfile() {
    alert('Edit profile functionality coming soon!');
}

function viewOrders() {
    alert('View orders functionality coming soon!');
}

function viewApplications() {
    alert('View applications functionality coming soon!');
} 