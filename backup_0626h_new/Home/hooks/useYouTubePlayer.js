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

  // 시청인증 상태를 localStorage에서 불러오기
  const getFanCertificationStatus = (videoId) => {
    if (!videoId) return false;
    const certifiedVideos = JSON.parse(localStorage.getItem('fanCertifiedVideos') || '{}');
    return certifiedVideos[videoId] || false;
  };

  // 시청인증 상태를 localStorage에 저장하기
  const saveFanCertificationStatus = (videoId, status) => {
    if (!videoId) return;
    const certifiedVideos = JSON.parse(localStorage.getItem('fanCertifiedVideos') || '{}');
    certifiedVideos[videoId] = status;
    localStorage.setItem('fanCertifiedVideos', JSON.stringify(certifiedVideos));
  };

  // 선택된 비디오가 변경될 때 시청인증 상태 확인
  useEffect(() => {
    if (selectedVideoId) {
      const isCertified = getFanCertificationStatus(selectedVideoId);
      setFanCertified(isCertified);
    }
  }, [selectedVideoId]);

  // 시청인증 상태가 변경될 때 localStorage에 저장
  useEffect(() => {
    if (selectedVideoId && fanCertified) {
      saveFanCertificationStatus(selectedVideoId, true);
    }
  }, [selectedVideoId, fanCertified]);

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
    currentVideoRef,
    getFanCertificationStatus,
    saveFanCertificationStatus
  };
}; 