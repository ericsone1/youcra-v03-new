// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
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

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase 초기화 실패:', error);
  throw error;
}

// Initialize Firebase services with error handling
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics는 프로덕션에서만 초기화
let analytics = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    // Analytics 오류는 무시 (선택적 기능)
  }
}

export { analytics };

// Firestore 설정 및 오류 처리
if (typeof window !== 'undefined') {
  try {
    // 개발 환경에서 에뮬레이터 연결 (필요시)
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true') {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    
    // Firestore 오류 이벤트 리스너
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message) {
        const message = event.reason.message;
        if (message.includes('BloomFilter') || 
            message.includes('firestore') ||
            message.includes('index')) {
          // Firestore 관련 오류는 무시
          event.preventDefault();
        }
      }
    });
    
  } catch (error) {
    // Firestore 설정 오류는 무시
  }
}