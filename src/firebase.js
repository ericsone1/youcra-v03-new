// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC-B7UPx0VFLiuNRKB1QROxkb_FWWdZ46I",
  authDomain: "youcra-v03.firebaseapp.com",
  projectId: "youcra-v03",
  storageBucket: "youcra-v03.firebasestorage.app",
  messagingSenderId: "834856745369",
  appId: "1:834856745369:web:cab7055f05de9cbc9e7b08",
  measurementId: "G-LJL9LWRL5P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);