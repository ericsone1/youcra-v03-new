import React from 'react';

const SimpleTrackingIndicator = ({ activeTrackers }) => {
  console.log('🟢 SimpleTrackingIndicator 렌더링:', activeTrackers?.size || 0);
  
  if (!activeTrackers || activeTrackers.size === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="font-bold mb-2">🎬 시청 추적 중</div>
      <div>활성 추적기: {activeTrackers.size}개</div>
      
      {Array.from(activeTrackers.entries()).map(([videoId, tracker]) => {
        const status = tracker.getStatus();
        return (
          <div key={videoId} className="mt-2 p-2 bg-blue-600 rounded">
            <div className="text-sm font-medium">{tracker.video.title}</div>
            <div className="text-xs">
              시청시간: {status.totalWatchTime}초 ({status.watchPercentage}%)
            </div>
            <div className="text-xs">
              상태: {status.isWatching ? '▶️ 시청중' : '⏸️ 대기중'}
            </div>
            <button
              onClick={() => tracker.stop()}
              className="mt-1 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
            >
              중단
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SimpleTrackingIndicator; 