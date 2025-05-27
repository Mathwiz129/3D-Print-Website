import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCGs8p2kkbH2bgIZVSdc37pC7iO9Bh9_kk",
    authDomain: "d-print-website.firebaseapp.com",
    projectId: "d-print-website",
    storageBucket: "d-print-website.appspot.com",
    messagingSenderId: "694635814417",
    appId: "1:694635814417:web:11e29a6384928c8fad5bb0"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Log Firebase status for debugging
console.log("Firebase initialized:", auth, db);

// ✅ Sign-Up Function (Stores Name in Firestore)
window.signUp = async function () {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user name in Firestore
        await setDoc(doc(db, "users", user.uid), { name: name, email: email });

        localStorage.setItem("userName", name);
        window.location.href = "home.html"; // Redirect to home page
    } catch (error) {
        alert(error.message);
    }
};

// ✅ Sign-In Function (Retrieves Name from Firestore)
window.signIn = async function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    try {
        // Authenticate user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Fetch user's name from Firestore using UID
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const userName = docSnap.data().name;
            localStorage.setItem("userName", userName); // Store name in local storage
        }

        window.location.href = "home.html";
    } catch (error) {
        errorMessage.innerText = error.message;
        errorMessage.classList.remove("hidden");
    }
};

// ✅ Continue as Guest Function
document.addEventListener("DOMContentLoaded", function () {
    const guestButton = document.getElementById("guest");
    if (guestButton) {
        guestButton.addEventListener("click", function () {
            localStorage.setItem("userName", "Guest");
            window.location.href = "home.html"; // Redirect guest users to home page
        });
    }
});

// ✅ Display User Name in Navbar & Home Page
document.addEventListener("DOMContentLoaded", async function () {
    const navbarContainer = document.getElementById("navbar");
    
    if (navbarContainer) {
        try {
            const response = await fetch("components/navbar.html");
            const navbarHTML = await response.text();
            navbarContainer.innerHTML = navbarHTML;

            // ✅ Wait for the navbar to be inserted, then update the account name
            setTimeout(() => {
                const accountNameEl = document.getElementById("account-name");
                if (accountNameEl) {
                    accountNameEl.innerText = localStorage.getItem("userName") || "Guest";
                } else {
                    console.error("Element #account-name not found.");
                }
            }, 100); // Give time for DOM update
        } catch (error) {
            console.error("Error loading navbar:", error);
        }
    }
});

// ✅ Popup Handling for Account & Provider Info
window.openAccountPopup = async function () {
    const popupContainer = document.getElementById("popup");
    if (popupContainer) {
        try {
            const response = await fetch("components/account-popup.html");
            popupContainer.innerHTML = await response.text();
        } catch (error) {
            console.error("Error loading account popup:", error);
        }
    }
};

window.openProviderPopup = async function () {
    const popupContainer = document.getElementById("popup");
    if (popupContainer) {
        try {
            const response = await fetch("components/provider-popup.html");
            popupContainer.innerHTML = await response.text();
        } catch (error) {
            console.error("Error loading provider popup:", error);
        }
    }
};