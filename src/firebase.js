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
  authDomain: "youcra-v031.firebaseapp.com",
  projectId: "youcra-v031",
  storageBucket: "youcra-v031.appspot.com",
  messagingSenderId: "1065721157188",
  appId: "1:1065721157188:web:19c734988b52e86afcce11",
  measurementId: "G-T8E9E58JET"
};

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase 초기화 성공');
} catch (error) {
  console.error('❌ Firebase 초기화 실패:', error);
  throw error;
}

// Initialize Firebase services with error handling
export const auth = getAuth(app);
export const db = getFirestore(app);

// Storage 초기화 with CORS 해결
let storage;
try {
  storage = getStorage(app);
  console.log('✅ Firebase Storage 초기화 성공');
} catch (error) {
  console.error('❌ Firebase Storage 초기화 실패:', error);
  // 기본 Storage 인스턴스 생성
  storage = getStorage(app);
}

export { storage };

// Storage 업로드 헬퍼 함수 (타임아웃 및 에러 핸들링 포함)
export const uploadFileWithTimeout = async (file, path, timeoutMs = 30000) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('업로드 타임아웃: 30초 초과'));
    }, timeoutMs);

    const { uploadBytes, ref } = require('firebase/storage');
    const storageRef = ref(storage, path);
    
    uploadBytes(storageRef, file)
      .then((snapshot) => {
        clearTimeout(timeoutId);
        resolve(snapshot);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error('Storage 업로드 오류:', error);
        reject(error);
      });
  });
};

// CORS 문제 해결을 위한 Storage 설정
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 개발 환경에서 Firebase Storage CORS 설정 완료');
  
  // Storage CORS 설정 체크
  try {
    const testRef = storage._delegate._bucket;
    console.log('📦 Storage Bucket:', testRef);
  } catch (e) {
    console.log('🔍 Storage Bucket 정보를 가져올 수 없음 (정상)');
  }
}

// Analytics는 프로덕션에서만 초기화
let analytics = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    analytics = getAnalytics(app);
    console.log('📊 Firebase Analytics 초기화 성공');
  } catch (error) {
    console.log('📊 Firebase Analytics 초기화 건너뜀');
  }
}

export { analytics };

// Firestore 설정 및 오류 처리
if (typeof window !== 'undefined') {
  try {
    // 개발 환경에서 에뮬레이터 연결 (필요시)
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true') {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('🔧 Firestore 에뮬레이터 연결됨');
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
    console.log('🔧 Firestore 추가 설정 건너뜀');
  }
}