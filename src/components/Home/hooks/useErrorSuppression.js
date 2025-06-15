import { useEffect } from 'react';

export const useErrorSuppression = () => {
  // YouTube 에러 억제를 위한 선별적 에러 핸들러 (플레이어 정리는 방해하지 않음)
  useEffect(() => {
    const originalError = window.console.error;
    const originalWarn = window.console.warn;
    
    window.console.error = (...args) => {
      const message = args.join(' ');
      // 플레이어 관련 중요한 에러는 놔두고, 스팸성 에러만 억제
      if (message.includes('signature decipher') ||
          message.includes('ProcessPage: TypeError') ||
          message.includes('chrome-extension') ||
          message.includes('Content Security Policy')) {
        return; // 스팸성 에러만 무시
      }
      originalError.apply(console, args);
    };
    
    window.console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('signature decipher') ||
          message.includes('ProcessPage') ||
          message.includes('chrome-extension')) {
        return; // 스팸성 경고만 무시
      }
      originalWarn.apply(console, args);
    };

    return () => {
      window.console.error = originalError;
      window.console.warn = originalWarn;
    };
  }, []);
}; 