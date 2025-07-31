import React, { useState, useEffect } from 'react';

/**
 * YouTube 팝업창 차단 안내 컴포넌트
 */
export const YouTubeViewNotification = ({ videoId, onClose }) => {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // 팝업창이 차단되었는지 확인
    const checkPopupBlocked = () => {
      const testPopup = window.open('', 'test', 'width=1,height=1');
      if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
        setShowNotification(true);
      } else {
        testPopup.close();
      }
    };

    // 2초 후 팝업창 차단 여부 확인
    const timer = setTimeout(checkPopupBlocked, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleYouTubeRedirect = () => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    window.open(youtubeUrl, '_blank');
    setShowNotification(false);
    if (onClose) onClose();
  };

  if (!showNotification) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-sm shadow-lg z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            팝업창이 차단되었습니다
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>YouTube 조회수에 반영되도록 YouTube 페이지에 접속해주세요.</p>
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleYouTubeRedirect}
              className="bg-yellow-400 hover:bg-yellow-500 text-yellow-800 px-3 py-1 rounded text-xs font-medium"
            >
              YouTube에서 보기
            </button>
            <button
              onClick={() => {
                setShowNotification(false);
                if (onClose) onClose();
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-xs font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeViewNotification; 