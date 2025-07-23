// 🎯 비디오 플레이어 핵심 로직
// 원본: HomeVideoPlayer.js에서 추출

import React, { useEffect, useRef } from 'react';
import { useVideoPlayer } from '../../contexts/VideoPlayerContext';
import { useWatchedVideos } from '../../contexts/WatchedVideosContext';
import { VideoPlayerUI } from './VideoPlayerUI';
import { 
  useVideoPlayerState, 
  useDragState, 
  useCertificationState, 
  useVideoEventHandlers, 
  useVideoQueue, 
  useCleanup 
} from './VideoPlayerHooks';
import { 
  handleDragStart, 
  handleDragMove, 
  handleDragEnd, 
  handleTouchStart, 
  handleTouchMove, 
  handleTouchEnd 
} from './VideoPlayerUtils';

export default function VideoPlayerCore({
  video,
  videoQueue = [],
  currentIndex = 0,
  minimized = false,
  pos = null,
  onClose,
  onNext,
  onPrev,
  onMinimize,
  onRestore,
  onDrag,
  onCertifyComplete
}) {
  console.log('[VideoPlayerCore 렌더]', { video, videoQueue, currentIndex, minimized });
  
  if (!video) {
    console.log('[VideoPlayerCore] video가 없어서 return null');
    return null;
  }
  
  const { playerRef, setIsPlaying, fanCertified, setFanCertified } = useVideoPlayer();
  const localPlayerRef = useRef();
  const dragRef = useRef();
  const [timer, setTimer] = useState(5);

  // 비디오 플레이어 상태 관리
  const {
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
  } = useVideoPlayerState(video, videoQueue, currentIndex);

  // 드래그 상태 관리
  const {
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    position,
    setPosition
  } = useDragState(minimized, pos);

  // 인증 상태 관리
  const { handleCertification } = useCertificationState(onCertifyComplete);

  // 영상 재생 이벤트 핸들러
  const {
    handleReady,
    handleStateChange,
    handleYoutubeEnd
  } = useVideoEventHandlers(
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

  // 영상 큐 관리
  const {
    handleNextVideo,
    handlePrevVideo,
    handleNextVideoSafe,
    handlePrevVideoSafe
  } = useVideoQueue(videoQueue, currentIndex, onNext, onPrev);

  // 정리(cleanup)
  useCleanup(watchInterval);

  // 마우스 드래그 핸들러
  const handleMouseDown = (e) => {
    return handleDragStart(e, setIsDragging, position, setDragStart, onDrag);
  };

  const handleMouseMove = (e) => {
    handleDragMove(e, isDragging, dragStart, setPosition, onDrag);
  };

  const handleMouseUp = (e) => {
    handleDragEnd(setIsDragging, onDrag);
  };

  // 터치 드래그 핸들러
  const handleTouchStart = (e) => {
    return handleTouchStart(e, setIsDragging, position, setDragStart, onDrag);
  };

  const handleTouchMove = (e) => {
    handleTouchMove(e, isDragging, dragStart, setPosition, onDrag);
  };

  const handleTouchEnd = (e) => {
    handleTouchEnd(setIsDragging, onDrag);
  };

  // 인증 완료 처리
  useEffect(() => {
    if (certStage === 'certifying' && !certLoading) {
      const certifyAsync = async () => {
        try {
          setCertLoading(true);
          
          // 시청 횟수 증가
          await incrementWatchCount(currentVideo.videoId);
          
          // 인증 상태 설정
          await watchedVideosSetCertified(currentVideo.videoId, true);
          setFanCertified(true);
          setCertStage('certified');
          
          // 콜백 호출
          onCertifyComplete && onCertifyComplete(currentVideo);
          
        } catch (error) {
          console.error('인증 완료 처리 중 오류:', error);
        } finally {
          setCertLoading(false);
        }
      };
      
      certifyAsync();
    }
  }, [certStage, certLoading, currentVideo, onCertifyComplete]);

  // 카운트다운 처리
  useEffect(() => {
    if (certStage === 'countdown' && countdown > 0) {
      const countdownTimer = setTimeout(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCertStage('certifying');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearTimeout(countdownTimer);
    }
  }, [certStage, countdown, setCertStage]);

  // 인증 지연 타이머 처리
  useEffect(() => {
    if (showCertificationDelay && certificationTimer > 0) {
      const certTimer = setTimeout(() => {
        setCertificationTimer(prev => {
          if (prev <= 1) {
            setShowCertificationDelay(false);
            setCertStage('certifying');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearTimeout(certTimer);
    }
  }, [showCertificationDelay, certificationTimer, setCertStage]);

  // 영상 변경 시 상태 초기화
  useEffect(() => {
    setWatchSeconds(0);
    setLocalVideoEnded(false);
    setCertStage('watching');
    setShowCountdown(false);
    setShowCertificationDelay(false);
    setCertificationTimer(0);
    setCountdown(5);
    
    if (watchInterval) {
      clearInterval(watchInterval);
      setWatchInterval(null);
    }
  }, [currentVideo?.videoId]);

  // 영상 재생 상태에 따른 자동 다음 영상
  useEffect(() => {
    if (localVideoEnded && certStage === 'certified') {
      const nextTimer = setTimeout(() => {
        handleNextVideoSafe();
      }, 2000);
      
      return () => clearTimeout(nextTimer);
    }
  }, [localVideoEnded, certStage, handleNextVideoSafe]);

  // 영상 길이 계산
  const videoDuration = actualDuration || (video.duration ? parseInt(video.duration) : 0);

  return (
    <VideoPlayerUI
      video={video}
      minimized={minimized}
      position={position}
      isDragging={isDragging}
      handleMouseDown={handleMouseDown}
      handleMouseMove={handleMouseMove}
      handleMouseUp={handleMouseUp}
      handleTouchStart={handleTouchStart}
      handleTouchMove={handleTouchMove}
      handleTouchEnd={handleTouchEnd}
      onClose={onClose}
      onMinimize={onMinimize}
      onRestore={onRestore}
      handleNextVideo={handleNextVideo}
      handlePrevVideo={handlePrevVideo}
      videoQueue={videoQueue}
      currentIndex={currentIndex}
      watchSeconds={watchSeconds}
      videoDuration={videoDuration}
      certStage={certStage}
      fanCertified={fanCertified}
      timer={timer}
      handleReady={handleReady}
      handleStateChange={handleStateChange}
      handleYoutubeEnd={handleYoutubeEnd}
      currentVideo={currentVideo}
    />
  );
} 