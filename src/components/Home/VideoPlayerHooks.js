// 🎣 비디오 플레이어 커스텀 훅들
// 원본: HomeVideoPlayer.js에서 추출

import { useState, useEffect, useRef } from 'react';
import { useVideoPlayer } from '../../contexts/VideoPlayerContext';
import { useWatchedVideos } from '../../contexts/WatchedVideosContext';
import { CERT_STAGES, handleCertificationComplete, handleVideoStateChange } from './VideoPlayerUtils';

// 비디오 플레이어 상태 관리 훅
export const useVideoPlayerState = (video, videoQueue, currentIndex) => {
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [localVideoEnded, setLocalVideoEnded] = useState(false);
  const [actualDuration, setActualDuration] = useState(0);
  const [watchInterval, setWatchInterval] = useState(null);
  const [certificationTimer, setCertificationTimer] = useState(0);
  const [showCertificationDelay, setShowCertificationDelay] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [certStage, setCertStage] = useState(CERT_STAGES.WATCHING);

  // 현재 재생할 영상
  const currentVideo = videoQueue.length > 0 ? videoQueue[currentIndex] : video;

  return {
    watchSeconds,
    setWatchSeconds,
    localVideoEnded,
    setLocalVideoEnded,
    actualDuration,
    setActualDuration,
    watchInterval,
    setWatchInterval,
    certificationTimer,
    setCertificationTimer,
    showCertificationDelay,
    setShowCertificationDelay,
    countdown,
    setCountdown,
    showCountdown,
    setShowCountdown,
    certLoading,
    setCertLoading,
    certStage,
    setCertStage,
    currentVideo
  };
};

// 드래그 상태 관리 훅
export const useDragState = (minimized, pos) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(() => {
    if (pos) return pos;
    return minimized 
      ? { x: window.innerWidth - 100, y: window.innerHeight - 100 }
      : { x: (window.innerWidth - 400) / 2, y: 50 };
  });

  return {
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    position,
    setPosition
  };
};

// 인증 상태 관리 훅
export const useCertificationState = (onCertifyComplete) => {
  const { incrementWatchCount, setCertified: watchedVideosSetCertified } = useWatchedVideos();
  const { setFanCertified } = useVideoPlayer();

  const handleCertification = async (videoData) => {
    await handleCertificationComplete(
      videoData,
      incrementWatchCount,
      watchedVideosSetCertified,
      setFanCertified,
      setCertStage,
      setCertLoading,
      onCertifyComplete
    );
  };

  return {
    handleCertification
  };
};

// 영상 재생 이벤트 핸들러 훅
export const useVideoEventHandlers = (
  setWatchSeconds,
  setLocalVideoEnded,
  setCertStage,
  setShowCountdown,
  setCountdown,
  actualDuration,
  watchInterval,
  setWatchInterval,
  setCertificationTimer,
  setShowCertificationDelay
) => {
  const handleReady = (event) => {
    console.log('[YouTube Player Ready]', event);
    
    const tryGetDuration = () => {
      try {
        const duration = event.target.getDuration();
        if (duration && duration > 0) {
          console.log('[YouTube Duration]', duration);
          setActualDuration(duration);
        } else {
          setTimeout(tryGetDuration, 1000);
        }
      } catch (error) {
        console.warn('[YouTube Duration Error]', error);
        setTimeout(tryGetDuration, 1000);
      }
    };
    
    tryGetDuration();
  };

  const handleStateChange = (event) => {
    handleVideoStateChange(
      event,
      setWatchSeconds,
      setLocalVideoEnded,
      setCertStage,
      setShowCountdown,
      setCountdown,
      actualDuration,
      watchInterval,
      setWatchInterval,
      setCertificationTimer,
      setShowCertificationDelay
    );
  };

  const handleYoutubeEnd = () => {
    console.log('[YouTube Player End]');
    setLocalVideoEnded(true);
  };

  return {
    handleReady,
    handleStateChange,
    handleYoutubeEnd
  };
};

// 영상 큐 관리 훅
export const useVideoQueue = (videoQueue, currentIndex, onNext, onPrev) => {
  const handleNextVideoSafe = () => {
    if (videoQueue.length > 0 && currentIndex < videoQueue.length - 1) {
      onNext && onNext();
    }
  };

  const handlePrevVideoSafe = () => {
    if (videoQueue.length > 0 && currentIndex > 0) {
      onPrev && onPrev();
    }
  };

  const handleNextVideo = () => {
    console.log('[Next Video]', { currentIndex, queueLength: videoQueue.length });
    handleNextVideoSafe();
  };

  const handlePrevVideo = () => {
    console.log('[Prev Video]', { currentIndex, queueLength: videoQueue.length });
    handlePrevVideoSafe();
  };

  return {
    handleNextVideo,
    handlePrevVideo,
    handleNextVideoSafe,
    handlePrevVideoSafe
  };
};

// 정리(cleanup) 훅
export const useCleanup = (watchInterval) => {
  useEffect(() => {
    return () => {
      if (watchInterval) {
        clearInterval(watchInterval);
      }
    };
  }, [watchInterval]);
}; 