import React, { useState, useEffect } from 'react';
import { 
  isInAppBrowser, 
  isAndroid, 
  isIOS, 
  openInExternalBrowser,
  handleInAppBrowserRedirect 
} from '../utils/browserDetector';

const InAppBrowserTest = () => {
  const [browserInfo, setBrowserInfo] = useState({
    userAgent: '',
    isInApp: false,
    isAndroid: false,
    isIOS: false,
    platform: ''
  });

  useEffect(() => {
    setBrowserInfo({
      userAgent: navigator.userAgent,
      isInApp: isInAppBrowser(),
      isAndroid: isAndroid(),
      isIOS: isIOS(),
      platform: navigator.platform
    });
  }, []);

  const handleTestRedirect = () => {
    const currentUrl = window.location.href;
    handleInAppBrowserRedirect(currentUrl, false);
  };

  const handleForceRedirect = () => {
    const currentUrl = window.location.href;
    openInExternalBrowser(currentUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          인앱 브라우저 테스트
        </h1>

        {/* 브라우저 정보 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">브라우저 정보</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">User Agent:</span>
              <span className="text-gray-600 break-all">{browserInfo.userAgent}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Platform:</span>
              <span className="text-gray-600">{browserInfo.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">인앱 브라우저:</span>
              <span className={`font-bold ${browserInfo.isInApp ? 'text-red-600' : 'text-green-600'}`}>
                {browserInfo.isInApp ? '예' : '아니오'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Android:</span>
              <span className={`font-bold ${browserInfo.isAndroid ? 'text-blue-600' : 'text-gray-600'}`}>
                {browserInfo.isAndroid ? '예' : '아니오'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">iOS:</span>
              <span className={`font-bold ${browserInfo.isIOS ? 'text-blue-600' : 'text-gray-600'}`}>
                {browserInfo.isIOS ? '예' : '아니오'}
              </span>
            </div>
          </div>
        </div>

        {/* 테스트 버튼들 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">테스트 기능</h2>
          <div className="space-y-3">
            <button
              onClick={handleTestRedirect}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              외부 브라우저로 이동 (확인 후)
            </button>
            
            <button
              onClick={handleForceRedirect}
              className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              외부 브라우저로 강제 이동
            </button>
            
            <button
              onClick={() => window.open('https://www.ucrachat.com', '_blank')}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              새 창에서 유크라 열기
            </button>
          </div>
        </div>

        {/* 인앱 브라우저 경고 */}
        {browserInfo.isInApp && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  인앱 브라우저 감지됨
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    현재 카카오톡, 페이스북 등의 인앱 브라우저에서 접속 중입니다.
                    구글 로그인을 위해서는 외부 브라우저(Chrome, Safari 등)에서 접속해주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">사용법</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>1. 카카오톡에서 이 페이지 링크를 공유하세요</p>
            <p>2. 링크를 클릭하여 카카오톡 내 브라우저로 접속하세요</p>
            <p>3. "외부 브라우저로 이동" 버튼을 클릭하여 테스트하세요</p>
            <p>4. Android에서는 Chrome이, iOS에서는 Safari가 열립니다</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InAppBrowserTest; 