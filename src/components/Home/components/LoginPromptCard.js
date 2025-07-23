import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { isInAppBrowser, handleInAppBrowserRedirect } from '../../../utils/browserDetector';

export const LoginPromptCard = () => {
  const navigate = useNavigate();
  const [loadingGoogle, setLoadingGoogle] = React.useState(false);
  const [googleError, setGoogleError] = React.useState('');

  const handleGoogleLogin = async () => {
    setGoogleError('');
    setLoadingGoogle(true);
    
    // 인앱 브라우저 감지 및 처리
    if (isInAppBrowser()) {
      setLoadingGoogle(false);
      // 현재 URL을 외부 브라우저에서 열도록 처리
      const currentUrl = window.location.href;
      handleInAppBrowserRedirect(currentUrl, false); // 사용자 확인 후 실행
      return;
    }
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Firestore에 사용자 정보 저장/업데이트
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: 'google',
        createdAt: new Date(),
      }, { merge: true });
      // 로그인 후 상태 갱신은 context/provider 또는 상위 상태에서 처리
    } catch (err) {
      // 403 disallowed_useragent 오류인지 확인
      if (err.message.includes('disallowed_useragent') || err.message.includes('403')) {
        setGoogleError('카카오톡 내 브라우저에서는 구글 로그인이 지원되지 않습니다. 외부 브라우저에서 접속해주세요.');
        // 자동으로 외부 브라우저 실행
        const currentUrl = window.location.href;
        handleInAppBrowserRedirect(currentUrl, true);
      } else {
        setGoogleError('구글 로그인 실패: ' + err.message);
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-8 text-center"
    >
      <div className="w-16 h-16 mx-auto mb-6 bg-blue-500 rounded-2xl flex items-center justify-center">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        로그인이 필요합니다
      </h2>
      <p className="text-gray-600 mb-8">
        영상 시청과 토큰 적립을 위해 로그인해주세요
      </p>
      {/* 에러 메시지 */}
      {googleError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{googleError}</p>
        </div>
      )}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          className="w-full py-3 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5"><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.36 30.77 0 24 0 14.82 0 6.71 5.1 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.03l7.18 5.59C43.98 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.99 16.1 0 19.94 0 24c0 4.06.99 7.9 2.69 11.9l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.15 15.9-5.85l-7.18-5.59c-2.01 1.35-4.59 2.15-8.72 2.15-6.38 0-11.87-3.63-14.33-8.89l-7.98 6.2C6.71 42.9 14.82 48 24 48z"/></svg>
          <span>Google로 로그인</span>
        </button>
      </div>
    </motion.div>
  );
}; 