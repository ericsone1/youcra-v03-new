import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WatchTrackingIndicator = ({ activeTrackers, onStopTracking }) => {
  const [trackingData, setTrackingData] = useState([]);

  console.log('🎯 WatchTrackingIndicator 렌더링됨:', {
    activeTrackers: activeTrackers?.size || 0,
    onStopTracking: !!onStopTracking
  });

  useEffect(() => {
    console.log('🔄 WatchTrackingIndicator useEffect:', activeTrackers?.size || 0);
    
    if (!activeTrackers || activeTrackers.size === 0) {
      console.log('❌ 활성 추적기 없음');
      setTrackingData([]);
      return;
    }

    // 1초마다 추적 데이터 업데이트
    const interval = setInterval(() => {
      const data = [];
      activeTrackers.forEach((tracker, videoId) => {
        const status = tracker.getStatus();
        data.push({
          videoId,
          title: tracker.video.title,
          duration: tracker.video.duration,
          ...status
        });
      });
      setTrackingData(data);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTrackers]);

  if (trackingData.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-lg border-2 border-blue-200 p-4 max-w-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
          />
          <span className="font-bold text-blue-600">시청 추적 중</span>
        </div>

        <div className="space-y-3">
          {trackingData.map((data) => (
            <motion.div
              key={data.videoId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-50 rounded-lg p-3"
            >
              <div className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                {data.title}
              </div>
              
              <div className="space-y-2">
                {/* 시청 시간 */}
                <div className="flex justify-between text-xs text-gray-600">
                  <span>시청시간</span>
                  <span className="font-mono font-bold text-blue-600">
                    {Math.floor(data.totalWatchTime / 60)}:{(data.totalWatchTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* 진행률 바 */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full transition-colors ${
                        data.watchPercentage >= 70 
                          ? 'bg-green-500' 
                          : data.watchPercentage >= 50 
                          ? 'bg-yellow-500' 
                          : 'bg-blue-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(data.watchPercentage, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{data.watchPercentage}%</span>
                    <span>목표: 70%</span>
                  </div>
                </div>

                {/* 현재 상태 */}
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    data.isWatching ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className={data.isWatching ? 'text-green-600' : 'text-red-600'}>
                    {data.isWatching ? '시청 중' : '일시정지'}
                  </span>
                </div>

                {/* 토큰 지급까지 남은 시간 */}
                {data.watchPercentage < 70 && (
                  <div className="text-xs text-gray-500">
                    토큰까지: {Math.max(0, Math.ceil(data.duration * 0.7) - data.totalWatchTime)}초 남음
                  </div>
                )}

                {/* 수동 제어 버튼들 */}
                <div className="mt-2 flex gap-2">
                  {data.watchPercentage >= 70 ? (
                    <button
                      onClick={() => onStopTracking && onStopTracking(data.videoId)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded transition-colors"
                    >
                      ✅ 시청완료
                    </button>
                  ) : (
                    <button
                      onClick={() => onStopTracking && onStopTracking(data.videoId)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded transition-colors"
                    >
                      ⏹️ 중단
                    </button>
                  )}
                  <button
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${data.videoId}`, '_blank')}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded transition-colors"
                  >
                    🔗 재열기
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 text-xs text-gray-500 text-center">
          💡 다른 탭으로 이동하면 자동으로 추적됩니다
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WatchTrackingIndicator; 