import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { isInAppBrowser, handleInAppBrowserRedirect } from '../utils/browserDetector';

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 구글 로그인 핸들러
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    // 인앱 브라우저 감지 및 처리
    if (isInAppBrowser()) {
      setLoading(false);
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
        isEmailUser: true
      }, { merge: true });
      
      console.log('✅ 구글 로그인 성공:', user.email);
      navigate(-1); // 이전 페이지로 이동
    } catch (err) {
      console.error('❌ 구글 로그인 실패:', err);
      
      // 403 disallowed_useragent 오류인지 확인
      if (err.message.includes('disallowed_useragent') || err.message.includes('403')) {
        setError('카카오톡 내 브라우저에서는 구글 로그인이 지원되지 않습니다. 외부 브라우저에서 접속해주세요.');
        // 자동으로 외부 브라우저 실행
        const currentUrl = window.location.href;
        handleInAppBrowserRedirect(currentUrl, true);
      } else {
        setError('구글 로그인 실패: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6 pb-24">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">UC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            유크라에 로그인
          </h1>
          <p className="text-gray-600 text-sm">
            구글 계정으로 안전하게 로그인하세요
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* 구글 로그인 버튼 */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-3 text-base transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.36 30.77 0 24 0 14.82 0 6.71 5.1 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.03l7.18 5.59C43.98 37.13 46.1 31.3 46.1 24.55z"/>
                <path fill="#FBBC05" d="M10.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.99 16.1 0 19.94 0 24c0 4.06.99 7.9 2.69 11.9l7.98-6.2z"/>
                <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.15 15.9-5.85l-7.18-5.59c-2.01 1.35-4.59 2.15-8.72 2.15-6.38 0-11.87-3.63-14.33-8.89l-7.98 6.2C6.71 42.9 14.82 48 24 48z"/>
              </svg>
            )}
            <span>{loading ? '로그인 중...' : 'Google로 로그인'}</span>
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            🔐 구글 계정으로 로그인하면 모든 기기에서<br/>
            동일한 계정으로 동기화됩니다
          </p>
        </div>

        {/* 인앱 브라우저 안내 */}
        {isInAppBrowser() && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 text-sm text-center">
              <strong>⚠️ 인앱 브라우저 감지</strong><br/>
              카카오톡, 인스타그램 등의 앱 내 브라우저에서는<br/>
              구글 로그인이 제한될 수 있습니다.<br/>
              <button 
                onClick={() => handleInAppBrowserRedirect(window.location.href, true)}
                className="mt-2 text-blue-600 underline font-semibold"
              >
                외부 브라우저에서 열기
              </button>
            </div>
          </div>
        )}

        {/* 홈으로 돌아가기 */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>

      {/* 하단 탭바 */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around items-center h-16 z-50">
        <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
          </svg>
          <span className="text-xs">홈</span>
        </Link>
        <Link to="/chat" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m10 0V6a4 4 0 00-8 0v2" />
          </svg>
          <span className="text-xs">채팅방</span>
        </Link>
        <Link to="/board" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <span className="text-xs">게시판</span>
        </Link>
        <Link to="/my" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs">마이채널</span>
        </Link>
      </footer>
    </div>
  );
}

export default LoginPage;