import { useEffect } from 'react';

export const useErrorSuppression = () => {
  // Firebase 권한 에러와 YouTube 에러 억제를 위한 포괄적 에러 핸들러
  useEffect(() => {
    const originalError = window.console.error;
    const originalWarn = window.console.warn;
    
    window.console.error = (...args) => {
      const message = args.join(' ');
      
      // Firebase 권한 에러 억제
      if (message.includes('Missing or insufficient permissions') ||
          message.includes('FirebaseError') ||
          message.includes('permission-denied') ||
          message.includes('unauthenticated')) {
        return; // Firebase 권한 에러 무시
      }
      
      // YouTube/비디오 관련 에러 억제  
      if (message.includes('signature decipher') ||
          message.includes('ProcessPage: TypeError') ||
          message.includes('YouTube') ||
          message.includes('video') ||
          message.includes('chrome-extension') ||
          message.includes('Content Security Policy') ||
          message.includes('Extension context invalidated')) {
        return; // 스팸성 에러 무시
      }
      
      // 네트워크 관련 일시적 에러 억제
      if (message.includes('Network Error') ||
          message.includes('Failed to fetch') ||
          message.includes('ERR_NETWORK')) {
        return; // 네트워크 에러 무시
      }
      
      originalError.apply(console, args);
    };
    
    window.console.warn = (...args) => {
      const message = args.join(' ');
      
      // Firebase 경고 억제
      if (message.includes('Firestore') ||
          message.includes('Firebase') ||
          message.includes('permissions') ||
          message.includes('signature decipher') ||
          message.includes('ProcessPage') ||
          message.includes('chrome-extension') ||
          message.includes('YouTube')) {
        return; // 스팸성 경고 무시
      }
      
      originalWarn.apply(console, args);
    };

    return () => {
      window.console.error = originalError;
      window.console.warn = originalWarn;
    };
  }, []);
}; 