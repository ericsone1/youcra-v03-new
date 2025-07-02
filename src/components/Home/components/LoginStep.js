import React from 'react';
import { motion } from 'framer-motion';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../../firebase';
import { doc, setDoc } from 'firebase/firestore';

export const LoginStep = ({ onComplete = () => {} }) => {
  // 구글 로그인 핸들러
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: 'google',
        createdAt: new Date(),
      }, { merge: true });
      
      onComplete();
    } catch (err) {
      console.error('구글 로그인 실패:', err);
      alert('구글 로그인 실패: ' + err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <div className="text-center">
        <motion.div 
          className="text-4xl mb-4"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          🔐
        </motion.div>
        
        <motion.h2 
          className="text-xl font-bold text-gray-900 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          로그인이 필요합니다
        </motion.h2>
        
        <motion.p 
          className="text-gray-500 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          영상 등록과 토큰 적립을 위해 로그인해주세요
        </motion.p>
        
        <motion.button
          onClick={handleGoogleLogin}
          className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 flex items-center gap-3 mx-auto transition-colors"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
            <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.36 30.77 0 24 0 14.82 0 6.71 5.1 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/>
            <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.03l7.18 5.59C43.98 37.13 46.1 31.3 46.1 24.55z"/>
            <path fill="#FBBC05" d="M10.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.99 16.1 0 19.94 0 24c0 4.06.99 7.9 2.69 11.9l7.98-6.2z"/>
            <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.15 15.9-5.85l-7.18-5.59c-2.01 1.35-4.59 2.15-8.72 2.15-6.38 0-11.87-3.63-14.33-8.89l-7.98 6.2C6.71 42.9 14.82 48 24 48z"/>
          </svg>
          <span>Google로 로그인</span>
        </motion.button>
      </div>
    </motion.div>
  );
}; 