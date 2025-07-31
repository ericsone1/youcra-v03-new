import React, { useState, useEffect } from 'react';
import { useWatchedVideos } from '../../../../contexts/WatchedVideosContext';
import { useAuth } from '../../../../hooks/useAuth';
import YouTubeViewNotification from './YouTubeViewNotification';

export default function VideoCard({ video, onVideoSelect, isSelected = false }) {
  const { getWatchInfo, setCertified, canRewatch, getTimeUntilRewatch } = useWatchedVideos();
  const { isAuthenticated } = useAuth();
  const [showYouTubeNotification, setShowYouTubeNotification] = useState(false);
  const [lastWatchedVideoId, setLastWatchedVideoId] = useState(null);

  const handleVideoEnd = async () => {
    if (!isAuthenticated) return;
    
    console.log('🎬 [VideoCard] 영상 시청 완료:', video.videoId);
    
    // 시청 완료 처리
    await setCertified(video.videoId, true, 'main');
    
    // YouTube 팝업창을 위한 상태 설정
    setLastWatchedVideoId(video.videoId);
    setShowYouTubeNotification(true);
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'}`}>
        {/* ... existing video card content ... */}
      </div>
      
      {/* YouTube 팝업창 차단 안내 */}
      {showYouTubeNotification && lastWatchedVideoId && (
        <YouTubeViewNotification
          videoId={lastWatchedVideoId}
          onClose={() => {
            setShowYouTubeNotification(false);
            setLastWatchedVideoId(null);
          }}
        />
      )}
    </>
  );
} 