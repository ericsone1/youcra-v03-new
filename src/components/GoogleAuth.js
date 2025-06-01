import React, { useState, useEffect } from 'react';

function GoogleAuth({ onAuthChange }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Google API 설정
  const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

  // 디버깅용 로그 (컴포넌트 마운트 시에만)
  useEffect(() => {
    console.log('🔍 GoogleAuth 컴포넌트 마운트');
    console.log('🔍 CLIENT_ID:', CLIENT_ID);
    console.log('🔍 CLIENT_ID 길이:', CLIENT_ID?.length);
    console.log('🔍 API_KEY:', API_KEY ? '설정됨' : '설정안됨');
    console.log('🔍 현재 Origin:', window.location.origin);
    console.log('🔍 모든 환경변수:', {
      CLIENT_ID: CLIENT_ID,
      API_KEY: API_KEY ? '***' : undefined,
      NODE_ENV: process.env.NODE_ENV
    });
  }, []);

  // Client ID가 없으면 에러 표시
  if (!CLIENT_ID || CLIENT_ID === 'your_client_id_here') {
    return (
      <div className="text-sm text-red-500">
        Google 로그인 설정 오류 - CLIENT_ID가 없습니다.
        <br />
        현재 CLIENT_ID: {CLIENT_ID || 'undefined'}
      </div>
    );
  }

  // Google Identity Services 초기화 (한 번만 실행)
  useEffect(() => {
    if (isInitialized) return;

    const initGoogleAuth = async () => {
      try {
        setIsLoading(true);
        
        // GSI 스크립트가 이미 로드되어 있는지 확인
        if (!window.google?.accounts?.id) {
          console.log('📡 Google Identity Services 로딩 중...');
          await loadGoogleScript();
        }

        // GSI 초기화 - 더 안정적인 설정
        console.log('🔧 Google Identity Services 초기화 중...');
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: false,
          // 추가 설정
          ux_mode: 'popup',
          context: 'signin'
        });

        setIsInitialized(true);
        console.log('✅ Google Identity Services 초기화 완료');
        
      } catch (error) {
        console.error('❌ Google Services 초기화 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initGoogleAuth();
  }, [CLIENT_ID, isInitialized]);

  // Google 스크립트 로드
  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      // 이미 존재하는 스크립트 확인
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        // 스크립트가 로드될 때까지 대기
        const checkGoogle = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(checkGoogle);
            resolve();
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkGoogle);
          reject(new Error('Google 스크립트 로드 타임아웃'));
        }, 10000);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        console.log('📡 Google 스크립트 로드 완료');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Google 스크립트 로드 실패');
        reject(new Error('Google 스크립트 로드 실패'));
      };
      document.head.appendChild(script);
    });
  };

  // Google 로그인 응답 처리
  const handleGoogleResponse = (response) => {
    try {
      console.log('🔐 Google 로그인 응답 받음');
      
      // JWT 토큰 파싱
      const userInfo = parseJwt(response.credential);
      if (!userInfo) {
        throw new Error('사용자 정보 파싱 실패');
      }

      const userData = {
        id: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture
      };

      setUser(userData);
      setIsSignedIn(true);
      onAuthChange?.(true, userData);
      
      console.log('✅ 로그인 성공:', userData);
      
    } catch (error) {
      console.error('❌ 로그인 처리 실패:', error);
      setIsSignedIn(false);
      setUser(null);
      onAuthChange?.(false, null);
    }
  };

  // JWT 토큰 파싱
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT 파싱 실패:', error);
      return null;
    }
  };

  // 로그인 버튼 클릭
  const handleSignIn = () => {
    if (!isInitialized) {
      console.warn('⚠️ Google Services가 아직 초기화되지 않음');
      return;
    }

    try {
      console.log('🔑 Google 로그인 시도');
      console.log('🔍 현재 CLIENT_ID:', CLIENT_ID);
      console.log('🔍 현재 Origin:', window.location.origin);
      setIsLoading(true);
      
      // GSI prompt 사용
      window.google.accounts.id.prompt((notification) => {
        setIsLoading(false);
        console.log('📱 Prompt 상태:', notification);
        
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          console.warn('⚠️ 로그인 프롬프트가 표시되지 않음:', reason);
          
          let message = '로그인 팝업을 표시할 수 없습니다.\n\n';
          
          if (reason === 'browser_not_supported') {
            message += '📱 브라우저가 지원되지 않습니다. Chrome, Firefox, Safari 등을 사용해주세요.';
          } else if (reason === 'invalid_client') {
            message += '🔧 Google 클라이언트 설정에 문제가 있습니다.\n클라이언트 ID: ' + CLIENT_ID + '\n현재 Origin: ' + window.location.origin;
          } else if (reason === 'unregistered_origin') {
            message += '🌐 Origin이 등록되지 않았습니다.\nGoogle Cloud Console에서 다음 URL을 승인된 JavaScript 원본에 추가해주세요:\n' + window.location.origin;
          } else {
            message += '🚫 팝업이 차단되었거나 기타 오류가 발생했습니다.\n팝업 차단기를 해제하고 다시 시도해주세요.\n\n오류 상세: ' + reason;
          }
          
          alert(message);
          
        } else if (notification.isSkippedMoment()) {
          const reason = notification.getSkippedReason();
          console.warn('⚠️ 로그인 프롬프트가 건너뜀:', reason);
        } else if (notification.isDismissedMoment()) {
          const reason = notification.getDismissedReason();
          console.log('ℹ️ 사용자가 로그인을 취소함:', reason);
        }
      });
    } catch (error) {
      console.error('❌ 로그인 시도 실패:', error);
      setIsLoading(false);
      alert('로그인 중 오류가 발생했습니다.\n페이지를 새로고침하고 다시 시도해주세요.');
    }
  };

  // 로그아웃
  const handleSignOut = () => {
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
      
      setIsSignedIn(false);
      setUser(null);
      onAuthChange?.(false, null);
      
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
    }
  };

  // YouTube API 기능을 위한 전역 함수 노출
  useEffect(() => {
    window.youtubeAPI = {
      isSignedIn,
      requestYouTubeAccess: async () => {
        if (!isSignedIn) {
          alert('먼저 Google 계정으로 로그인해주세요.');
          return false;
        }
        
        try {
          console.log('YouTube API 접근 권한 요청');
          return true;
        } catch (error) {
          console.error('YouTube API 접근 실패:', error);
          return false;
        }
      }
    };
  }, [isSignedIn]);

  // 로딩 중이거나 로그인되지 않은 상태
  if (!isSignedIn) {
    return (
      <button
        onClick={handleSignIn}
        disabled={isLoading || !isInitialized}
        className={`flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 ${
          (isLoading || !isInitialized) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>
          {!isInitialized ? '초기화 중...' : 
           isLoading ? '로딩 중...' : 
           'Google 로그인'}
        </span>
      </button>
    );
  }

  // 로그인된 상태 - 이제 상위 컴포넌트에서 처리하므로 null 반환
  return null;
}

export default GoogleAuth;