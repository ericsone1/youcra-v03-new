import React from 'react';

/**
 * YouTube 조회수 리다이렉트 컴포넌트
 * 시청 완료 후 실제 YouTube 페이지로 이동하여 조회수 반영
 */
export const YouTubeViewRedirect = ({ videoId, onRedirect }) => {
  const handleYouTubeRedirect = () => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log('🔄 [YouTubeViewRedirect] YouTube 페이지로 리다이렉트:', youtubeUrl);
    
    // 새 탭에서 YouTube 영상 열기
    window.open(youtubeUrl, '_blank');
    
    // 콜백 호출
    if (onRedirect) {
      onRedirect();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
        <div className="text-2xl mb-4">🎉</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          시청 완료!
        </h3>
        <p className="text-gray-600 mb-4">
          YouTube 조회수에 반영되도록<br/>
          실제 YouTube 페이지로 이동합니다
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleYouTubeRedirect}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
          >
            YouTube에서 보기
          </button>
          
          <button
            onClick={onRedirect}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-6 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          💡 YouTube 페이지 방문으로 조회수가 정확히 반영됩니다
        </div>
      </div>
    </div>
  );
};

export default YouTubeViewRedirect; 