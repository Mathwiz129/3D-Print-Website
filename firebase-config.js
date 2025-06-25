// Firebase Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
// You'll need to replace this with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAbUwgBItOT4kOnUnsliHpMgNI7ONQuAqA",
  authDomain: "outprint-3d-printing.firebaseapp.com",
  projectId: "outprint-3d-printing",
  storageBucket: "outprint-3d-printing.firebasestorage.app",
  messagingSenderId: "11337273606",
  appId: "1:11337273606:web:3daa9f8f673cae76c30e87",
  measurementId: "G-9G95YJB9LH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

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
  updateDoc
};

console.log('Firebase initialized successfully'); 