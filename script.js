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

// ✅ Sign-Up Function
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

// ✅ Sign-In Function
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

// ✅ Display User Name on Home Page
document.addEventListener("DOMContentLoaded", function () {
    const userInfo = document.getElementById("user-info");
    const userName = localStorage.getItem("userName") || "Guest";

    if (userInfo) {
        userInfo.innerHTML = userName === "Guest"
            ? `Logged in as: Guest | <a href="index.html">Sign In</a>`
            : `Logged in as: ${userName}`;
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const accountName = localStorage.getItem("userName") || "Guest";
    document.getElementById("account-name").innerText = accountName;
});

// Popup handling
window.openAccountPopup = function () {
    document.getElementById("popup").innerHTML = fetch("components/account-popup.html").then(res => res.text());
};

window.openProviderPopup = function () {
    document.getElementById("popup").innerHTML = fetch("components/provider-popup.html").then(res => res.text());
};
