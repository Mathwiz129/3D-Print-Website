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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Sign-Up Function
window.signUp = async function () {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), { name: name, email: email });

        localStorage.setItem("userName", name);
        window.location.href = "home.html";
    } catch (error) {
        alert(error.message);
    }
};

// Sign-In Function
window.signIn = async function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem("userName", userCredential.user.email); 
        window.location.href = "home.html"; // Redirect after successful login
    } catch (error) {
        alert(error.message);
    }
};


// Continue as Guest Function
document.addEventListener("DOMContentLoaded", function () {
    const guestButton = document.getElementById("guest");
    if (guestButton) {
        guestButton.addEventListener("click", function () {
            localStorage.setItem("userName", "Guest");
            window.location.href = "home.html";
        });
    }
});


// Display User Name on Home Page
if (document.getElementById("user-info")) {
    const userName = localStorage.getItem("userName");
    document.getElementById("user-info").innerText = `Logged in as: ${userName}`;
}