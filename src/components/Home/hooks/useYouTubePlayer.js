import { useState, useEffect, useRef } from 'react';

export const useYouTubePlayer = () => {
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchTimer, setWatchTimer] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [fanCertified, setFanCertified] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  
  const playerRef = useRef(null);
  const currentVideoRef = useRef(null);

  // 시청시간 타이머 관리
  useEffect(() => {
    if (isPlaying && selectedVideoId && !watchTimer) {
      const timer = setInterval(() => {
        setWatchSeconds(prev => prev + 1);
      }, 1000);
      setWatchTimer(timer);
    } else if (!isPlaying && watchTimer) {
      clearInterval(watchTimer);
      setWatchTimer(null);
    }

    return () => {
      if (watchTimer) clearInterval(watchTimer);
    };
  }, [isPlaying, selectedVideoId, watchTimer]);

  return {
    selectedVideoId,
    setSelectedVideoId,
    watchSeconds,
    setWatchSeconds,
    isPlaying,
    setIsPlaying,
    watchTimer,
    setWatchTimer,
    liked,
    setLiked,
    likeCount,
    setLikeCount,
    videoDuration,
    setVideoDuration,
    videoCompleted,
    setVideoCompleted,
    fanCertified,
    setFanCertified,
    videoEnded,
    setVideoEnded,
    playerLoading,
    setPlayerLoading,
    playerRef,
    currentVideoRef
  };
}; 