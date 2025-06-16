// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBH5YYBq5N1FL2a_0dIDmCVbwOpoOQumeE",
  authDomain: [
    "youcra-v031.firebaseapp.com",
    "localhost:3000",
    "localhost:3001",
    "ucrachat.com"
  ],
  projectId: "youcra-v031",
  storageBucket: "youcra-v031.firebasestorage.app",
  messagingSenderId: "1065721157188",
  appId: "1:1065721157188:web:19c734988b52e86afcce11",
  measurementId: "G-T8E9E58JET"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);