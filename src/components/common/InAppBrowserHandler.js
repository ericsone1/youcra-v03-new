import React, { useEffect, useState } from 'react';
import { isInAppBrowser, handleInAppBrowserRedirect } from '../../utils/browserDetector';

/**
 * 인앱 브라우저 감지 및 자동 처리 컴포넌트
 * 앱 전체에서 인앱 브라우저 접근 시 자동으로 외부 브라우저로 리다이렉트
 */
const InAppBrowserHandler = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    // 인앱 브라우저 감지
    const inApp = isInAppBrowser();
    setIsInApp(inApp);

    if (inApp) {
      // 인앱 브라우저에서 접근 시 경고 표시
      setShowWarning(true);
      
      // 3초 후 자동으로 외부 브라우저 실행
      const timer = setTimeout(() => {
        const currentUrl = window.location.href;
        handleInAppBrowserRedirect(currentUrl, true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  // 인앱 브라우저 경고 모달
  if (showWarning && isInApp) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            외부 브라우저로 이동
          </h3>
          
          <p className="text-gray-600 mb-4 text-sm">
            카카오톡 내 브라우저에서는 일부 기능이 제한됩니다.<br />
            외부 브라우저로 자동 이동합니다.
          </p>
          
          <div className="space-y-2">
            <button
              onClick={() => {
                const currentUrl = window.location.href;
                handleInAppBrowserRedirect(currentUrl, true);
              }}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              지금 이동하기
            </button>
            
            <button
              onClick={() => setShowWarning(false)}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              잠시 후 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default InAppBrowserHandler; 