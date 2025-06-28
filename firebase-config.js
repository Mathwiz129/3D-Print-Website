// Firebase Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Initialize Firebase with config from backend
let app, auth, db;

async function initializeFirebase() {
    try {
        // Fetch config from backend (secure)
        const response = await fetch('/api/firebase-config');
        const firebaseConfig = await response.json();
        
        // Initialize Firebase
        app = initializeApp(firebaseConfig);
        
        // Initialize Firebase Authentication and get a reference to the service
        auth = getAuth(app);
        
        // Initialize Cloud Firestore and get a reference to the service
        db = getFirestore(app);
        
        // Export Firebase services
        window.FirebaseAuth = {
            auth,
            createUserWithEmailAndPassword,
            signInWithEmailAndPassword,
            signOut,
            onAuthStateChanged,
            updatePassword,
            EmailAuthProvider,
            reauthenticateWithCredential
        };

        window.FirebaseDB = {
            db,
            doc,
            setDoc,
            getDoc,
            collection,
            addDoc,
            query,
            where,
            getDocs,
            updateDoc,
            deleteDoc,
            onSnapshot
        };

        console.log('Firebase initialized successfully');
        
        // Initialize materials helpers after Firebase is ready
        initializeMaterialsHelpers();
        
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
    }
}

// Initialize Firebase when the script loads
initializeFirebase();

// --- MATERIALS FIRESTORE HELPERS ---

function initializeMaterialsHelpers() {
    /**
     * Get all materials from Firestore (one-time fetch)
     * @returns {Promise<Array>} Array of material objects
     */
    async function getMaterialsFromFirestore() {
        const { db, collection, getDocs } = window.FirebaseDB;
        const snapshot = await getDocs(collection(db, 'materials'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    /**
     * Add a new material to Firestore
     * @param {Object} material
     * @returns {Promise}
     */
    async function addMaterialToFirestore(material) {
        const { db, collection, addDoc } = window.FirebaseDB;
        return await addDoc(collection(db, 'materials'), material);
    }

    /**
     * Update a material in Firestore
     * @param {string} id
     * @param {Object} data
     * @returns {Promise}
     */
    async function updateMaterialInFirestore(id, data) {
        const { db, doc, updateDoc } = window.FirebaseDB;
        return await updateDoc(doc(db, 'materials', id), data);
    }

    /**
     * Delete a material from Firestore
     * @param {string} id
     * @returns {Promise}
     */
    async function deleteMaterialFromFirestore(id) {
        const { db, doc, deleteDoc } = window.FirebaseDB;
        return await deleteDoc(doc(db, 'materials', id));
    }

    /**
     * Listen to real-time updates for materials
     * @param {function} callback
     * @returns {function} unsubscribe
     */
    function listenToMaterialsInFirestore(callback) {
        const { db, collection } = window.FirebaseDB;
        const { onSnapshot } = window.FirebaseDB;
        return onSnapshot(collection(db, 'materials'), (snapshot) => {
            const materials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(materials);
        });
    }

    // Export helpers globally
    window.MaterialsFirestore = {
        getMaterialsFromFirestore,
        addMaterialToFirestore,
        updateMaterialInFirestore,
        deleteMaterialFromFirestore,
        listenToMaterialsInFirestore
    };
} 