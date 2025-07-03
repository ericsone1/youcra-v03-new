import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import YouTubePlayerSection from './YouTubePlayerSection';
import { useVideoPlayer } from '../../contexts/VideoPlayerContext';
import { FaBolt, FaYoutube, FaHeart, FaTimes, FaCompress, FaExpand, FaPlay, FaBackward, FaForward, FaFire, FaMinus } from 'react-icons/fa';
import { MdPictureInPicture, MdFullscreen, MdFullscreenExit, MdClose } from 'react-icons/md';
import PlayerControlsSection from './PlayerControlsSection';
import { useWatchedVideos } from '../../contexts/WatchedVideosContext';
import { auth } from '../../firebase';

export default function HomeVideoPlayer({
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
  const {
    playerRef,
    setIsPlaying,
    fanCertified,
    setFanCertified
  } = useVideoPlayer();
  
  const localPlayerRef = useRef();
  const dragRef = useRef();
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [localVideoEnded, setLocalVideoEnded] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(false);
  const [actualDuration, setActualDuration] = useState(0);
  const [watchInterval, setWatchInterval] = useState(null);
  const [certificationTimer, setCertificationTimer] = useState(0);
  const [showCertificationDelay, setShowCertificationDelay] = useState(false);
  const [timer, setTimer] = useState(5);


  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(() => {
    if (pos) return pos;
    return minimized 
      ? { x: window.innerWidth - 100, y: window.innerHeight - 100 }
      : { x: (window.innerWidth - 400) / 2, y: 50 };
  });

  // 인증 상태 FSM: 'watching' | 'countdown' | 'certifying' | 'certified'
  const [certStage, setCertStage] = useState('watching');

  // 현재 재생할 영상
  const currentVideo = videoQueue.length > 0 ? videoQueue[currentIndex] : video;

  // WatchedVideos global context
  const { incrementWatchCount, setCertified: watchedVideosSetCertified } = useWatchedVideos();

  // 마우스 드래그 핸들러
  const handleMouseDown = (e) => {
    // 버튼이나 YouTube 플레이어 영역 클릭 시 드래그 방지
    if (e.target.closest('button') || e.target.closest('iframe') || e.target.closest('.youtube-player')) {
      return;
    }
    
    e.preventDefault();
    setIsDragging(true);
    
    // 현재 마우스 위치에서 플레이어 위치를 뺀 오프셋을 저장
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    
    // 드래그 중 선택 방지
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    
    onDrag && onDrag(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // 새로운 위치 = 현재 마우스 위치 - 드래그 시작 오프셋
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // 화면 경계 체크
    const playerWidth = minimized ? 80 : 400;
    const playerHeight = minimized ? 80 : 500;
    const maxX = window.innerWidth - playerWidth;
    const maxY = window.innerHeight - playerHeight;
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    setPosition({
      x: boundedX,
      y: boundedY
    });
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      onDrag && onDrag(false);
    }
  };

  // 터치 이벤트 핸들러 (모바일)
  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('iframe') || e.target.closest('.youtube-player')) {
      return;
    }
    
    // 최소화 상태에서는 드래그 시작하지 않음 (확장 우선)
    if (minimized) {
      return;
    }
    
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
    onDrag && onDrag(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    const playerWidth = minimized ? 80 : 400;
    const playerHeight = minimized ? 80 : 500;
    const maxX = window.innerWidth - playerWidth;
    const maxY = window.innerHeight - playerHeight;
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    setPosition({
      x: boundedX,
      y: boundedY
    });
  };

  const handleTouchEnd = (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      onDrag && onDrag(false);
    }
  };

  // 전역 이벤트 리스너 등록
  useEffect(() => {
    if (isDragging) {
      const options = { passive: false, capture: true };
      
      document.addEventListener('mousemove', handleMouseMove, options);
      document.addEventListener('mouseup', handleMouseUp, options);
      document.addEventListener('touchmove', handleTouchMove, options);
      document.addEventListener('touchend', handleTouchEnd, options);
      
    return () => {
        document.removeEventListener('mousemove', handleMouseMove, options);
        document.removeEventListener('mouseup', handleMouseUp, options);
        document.removeEventListener('touchmove', handleTouchMove, options);
        document.removeEventListener('touchend', handleTouchEnd, options);
      };
    }
  }, [isDragging, dragStart, position]);

  // 컴포넌트 초기화
  useEffect(() => {
    setWatchSeconds(0);
    setFanCertified(false);
    setLocalVideoEnded(false);
    setShowCountdown(false);
    setCountdown(5);
    setActualDuration(0);
    setShowCertificationDelay(false);
    setCertificationTimer(5);
    
    
    if (watchInterval) {
      clearInterval(watchInterval);
      setWatchInterval(null);
    }
  }, [video, setFanCertified]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (watchInterval) {
        clearInterval(watchInterval);
      }
    };
  }, [watchInterval]);

  /**********************
   *  새로운 인증 FSM 로직 *
   **********************/

  // 1) 90% 시청 시 인증 완료 처리
  useEffect(() => {
    if (certStage !== 'watching') return;

    const videoDuration = actualDuration > 0 ? actualDuration : (currentVideo?.duration || 0);
    const isLong = videoDuration >= 180;

    // 90% 시청 또는 3분 시청 시 인증 처리 (시청완료 표시)
    const canCertify = isLong 
      ? (watchSeconds >= videoDuration * 0.9 || watchSeconds >= 180)
      : localVideoEnded;

    if (canCertify && !fanCertified) {
      console.log('✅ 인증 조건 만족 (90%) – 시청완료 처리');
      setCertStage('countdown');
      setTimer(5);
      
      // 서버에 인증 저장
      const certifyAsync = async () => {
        try {
          const vidId = currentVideo?.videoId || currentVideo?.id || video.videoId || video.id || video.videoId;
          const videoData = {
            videoId: vidId,
            title: currentVideo?.title || video.title || '제목 없음',
            watchSeconds: Math.max(watchSeconds, actualDuration || 0),
            actualDuration: actualDuration || 0,
            watchedAt: new Date()
          };

          console.log('🔄 서버 인증 저장 시작', videoData);
          await handleCertification(videoData);
        } catch (err) {
          console.error('❌ 인증 실패', err);
        }
      };
      
      certifyAsync();
    }
  }, [certStage, watchSeconds, localVideoEnded, actualDuration, currentVideo, fanCertified]);

  // 2) 5초 카운트다운 처리 (별도 useEffect)
  useEffect(() => {
    if (certStage !== 'countdown') return;

    console.log('🕐 5초 카운트다운 시작');
    
    const interval = setInterval(() => {
      setTimer(prev => {
        const newTimer = prev - 1;
        console.log(`⏰ 다음 영상 이동까지: ${newTimer}초`);
        
        if (newTimer <= 0) {
          clearInterval(interval);
          console.log('➡️ 5초 카운트다운 완료 – 다음 영상으로 이동');
          
          // 다음 영상으로 이동
          handleNextVideo();

          // 상태 초기화 (다음 영상 대비)
          setTimeout(() => {
            setCertStage('watching');
            setFanCertified(false);
            setLocalVideoEnded(false);
            setWatchSeconds(0);
            setTimer(5);
          }, 100);
          
          return 0;
        }
        
        return newTimer;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [certStage]);

  // 인증 자동 처리 useEffect 수정 (기존 버전 - 비활성화)
  useEffect(() => {
    // 👉 FSM 로직으로 대체되어 더 이상 실행되지 않음
    return;
  /*
    console.log('인증 useEffect 실행:', {
      fanCertified,
      showCountdown,
      showCertificationDelay,
      watchSeconds,
      localVideoEnded,
      actualDuration
    });
@@
  }, [watchSeconds, localVideoEnded, fanCertified, showCountdown, showCertificationDelay, actualDuration, currentVideo, video.videoId]);
  */
  }, [watchSeconds, localVideoEnded, fanCertified, showCountdown, showCertificationDelay, actualDuration, currentVideo, video.videoId]);

  // 기존 인증 딜레이 타이머 로직 제거됨 (FSM으로 대체)

  // 영상 끝 감지 및 자동 인증 처리
  useEffect(() => {
    // 👉 FSM 로직으로 대체, 비활성화
    return;
  /*
    // 영상 끝 감지 및 자동 인증 처리
    if (localVideoEnded && !showCertificationDelay && !fanCertified) {
      console.log('🎬 영상 종료 감지 - 자동 인증 시작');
      setShowCertificationDelay(true);
      setShowCountdown(true);
      setCountdown(5);
      
      const timer = setInterval(() => {
        setCertificationTimer(prev => {
          console.log(`인증 타이머: ${prev}`);
          if (prev <= 1) {
            clearInterval(timer);
            
            // 인증 처리
            const videoData = {
              videoId: currentVideo?.videoId || 'unknown',
              title: currentVideo?.title || '제목 없음',
              watchSeconds: Math.max(watchSeconds, actualDuration || 0),
              actualDuration: actualDuration || 180,
              watchedAt: new Date()
            };
            
            console.log('✅ 자동 인증 처리:', videoData);
            handleCertification(videoData);
            
            setShowCertificationDelay(false);
            setShowCountdown(false);
            setCertificationTimer(5);
            
            // 상태 초기화 후 다음 영상으로
            setTimeout(() => {
              setLocalVideoEnded(false);
              handleNextVideo();
            }, 100);
            
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  */
  }, [localVideoEnded, showCertificationDelay, fanCertified, currentVideo, watchSeconds, actualDuration]);

  // 인증 처리 중에는 영상 전환 방지
  const isInteractionLocked = certStage !== 'watching';

  const handleNextVideoSafe = () => {
    if (isInteractionLocked) {
      console.log('⚠️ 인증/카운트다운 중 – 영상 전환 취소');
      return;
    }
    handleNextVideo();
  };

  const handlePrevVideoSafe = () => {
    if (isInteractionLocked) {
      console.log('⚠️ 인증/카운트다운 중 – 영상 전환 취소');
      return;
    }
    handlePrevVideo();
  };

  // 인증 처리 함수 (단일 시스템)
  const handleCertification = async (videoData) => {
    try {
      console.log('🔄 [HomeVideoPlayer] 새로운 단일 시스템 인증 저장:', {
        videoId: videoData.videoId,
        videoTitle: videoData.title,
        userId: auth.currentUser?.uid,
        savePath: `users/${auth.currentUser?.uid}/watchedVideos/${videoData.videoId}`
      });
      
      // 새로운 시스템에만 저장 (단일 시스템)
      await watchedVideosSetCertified(videoData.videoId, true);
      await incrementWatchCount(videoData.videoId);
      console.log('✅ [단일 시스템] 인증 및 시청 횟수 저장 완료');
      
      setFanCertified(true);
      
      if (onCertifyComplete) {
        onCertifyComplete(videoData);
      }
    } catch (error) {
      console.error('❌ [HomeVideoPlayer] 인증 저장 실패:', error);
    }
  };

  // 다음 영상으로 이동
  const handleNextVideo = () => {
    if (videoQueue.length > 1) {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= videoQueue.length) {
        // 마지막 영상이면 첫 번째로 순환
        console.log('🔄 마지막 영상 완료 - 첫 번째 영상으로 순환');
        if (onNext) onNext(0);
    } else {
        if (onNext) onNext(nextIndex);
      }
    }
  };

  // 이전 영상으로 이동
  const handlePrevVideo = () => {
    if (videoQueue.length > 1) {
      const prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        // 첫 번째 영상이면 마지막으로 순환
        if (onPrev) onPrev(videoQueue.length - 1);
      } else {
        if (onPrev) onPrev(prevIndex);
      }
    }
  };

  // YouTube 이벤트 핸들러
  const handleYoutubeEnd = () => {
    console.log('YouTube onEnd 이벤트 발생');
    // 영상 종료 상태는 handleStateChange에서 이미 설정됨
    // 인증 로직은 useEffect에서 자동 처리됨
    // 여기서는 아무것도 하지 않음 (useEffect가 모든 것을 처리)
  };

  const handleReady = (event) => {
    playerRef.current = event.target;
    localPlayerRef.current = event.target;
    setWatchSeconds(0);
    setLocalVideoEnded(false);
    
    let tryCount = 0;
    const tryGetDuration = () => {
      if (localPlayerRef.current && localPlayerRef.current.getDuration) {
        const duration = Math.floor(localPlayerRef.current.getDuration());
        if (duration && duration > 0) {
          setActualDuration(duration);
          return;
        }
      }
      if (tryCount < 5) {
        tryCount++;
        setTimeout(tryGetDuration, 500);
      }
    };
    setTimeout(tryGetDuration, 500);
  };

  const handleStateChange = (event) => {
    if (event.data === 1) {
      setIsPlaying(true);
      if (!watchInterval) {
        const newInterval = setInterval(() => {
          if (localPlayerRef.current && localPlayerRef.current.getCurrentTime) {
            const currentTime = Math.floor(localPlayerRef.current.getCurrentTime());
            setWatchSeconds(currentTime);
          }
        }, 1000);
        setWatchInterval(newInterval);
      }
      if (localPlayerRef.current && localPlayerRef.current.getDuration) {
        const duration = Math.floor(localPlayerRef.current.getDuration());
        if (duration && duration > 0) {
          setActualDuration(duration);
        }
      }
    } else {
      setIsPlaying(false);
      if (watchInterval) {
        clearInterval(watchInterval);
        setWatchInterval(null);
      }
    }
    
    // 영상 종료 시 (event.data === 0)
    if (event.data === 0) {
      setIsPlaying(false);
      setLocalVideoEnded(true);
      console.log('YouTube 플레이어 종료 - localVideoEnded 상태 설정 완료');
    }
  };

  const handleCertify = async () => {
    setCertLoading(true);
    setFanCertified(true);
    // 기존 localStorage 저장 시스템 제거됨
    setCertLoading(false);
    setShowCountdown(true);
  };

  // 시간 포맷 함수
  function formatTime(sec) {
    if ((!sec && sec !== 0) || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (!video) return null;

  // 인증 조건 분기
  const videoDuration = actualDuration > 0 ? actualDuration : (currentVideo?.duration || 0);
  const isLong = videoDuration >= 180;
  const certAvailable = isLong ? watchSeconds >= 180 : localVideoEnded;

  // Portal을 사용하여 body에 직접 렌더링
  return createPortal(
    <div
      ref={dragRef}
      className={`fixed z-50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${
              minimized
          ? 'w-20 h-20' 
          : 'w-[400px] max-w-[90vw]'
      }`}
            style={{
        left: position.x,
        top: position.y,
                pointerEvents: 'auto',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {minimized ? (
        // 최소화된 상태 - 모던한 스타일
        <div className="relative">
          <div 
            className="w-16 h-16 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl shadow-2xl flex items-center justify-center border-2 border-white/20 group cursor-pointer backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize && onMinimize(false);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onMinimize && onMinimize(false);
            }}
            style={{ touchAction: 'manipulation' }}
          >
            <FaPlay className="text-white text-3xl" />
          </div>
          {/* 최소화 상태에서도 항상 보이는 닫기 버튼 */}
          <button
            className="absolute -top-2 -right-2 w-7 h-7 bg-gray-800 hover:bg-red-600 text-white rounded-full text-sm flex items-center justify-center shadow-lg transition-all duration-200 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onClose && onClose();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
                  e.preventDefault();
              onClose && onClose();
            }}
            style={{ touchAction: 'manipulation' }}
            title="플레이어 닫기"
          >
            <MdClose size={14} />
          </button>
        </div>
      ) : (
        // 확장된 상태 - 모던한 UI 리디자인
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* 상단 헤더 */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600 ml-2">영상 플레이어</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize && onMinimize(true);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                title="최소화"
              >
                <FaMinus className="text-gray-500 text-sm" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose && onClose();
                }}
                className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                title="닫기"
              >
                <MdClose className="text-gray-500 text-sm hover:text-red-500" />
              </button>
            </div>
          </div>
          
          {/* YouTube 플레이어 */}
          <div className="youtube-player">
            <YouTubePlayerSection
              videoId={currentVideo?.videoId || video.videoId}
              minimized={false}
              onReady={handleReady}
              onStateChange={handleStateChange}
              onEnd={handleYoutubeEnd}
            />
          </div>
          
          {/* 영상 정보 섹션 */}
          <div className="p-3 space-y-3">
            {/* 제목과 채널 */}
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <FaFire className="text-white text-xs" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base leading-tight text-gray-900 mb-1" title={video.title}>
                  {video.title}
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  {video.channelTitle || video.channel || '채널명'}
                </p>
              </div>
            </div>
            
            {/* 시청 진행률 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-blue-600 font-bold text-sm">{formatTime(watchSeconds)}</div>
                    <div className="text-xs text-blue-500">시청</div>
                  </div>
                  <div className="w-px h-6 bg-blue-200"></div>
                  <div className="text-center">
                    <div className="text-gray-700 font-bold text-sm">{formatTime(videoDuration)}</div>
                    <div className="text-xs text-gray-500">전체</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-600 font-bold text-xs bg-yellow-100 px-2 py-1 rounded-full border border-yellow-200">
                  <FaBolt size={10}/> 
                  <span>풀시청</span>
                </div>
              </div>
              
              {/* 진행률 바 */}
              <div className="w-full bg-blue-200 rounded-full h-1.5 mb-1">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${videoDuration > 0 ? (watchSeconds / videoDuration) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-blue-600 text-center">
                {videoDuration > 0 ? Math.round((watchSeconds / videoDuration) * 100) : 0}% 완료
              </div>
            </div>
            
            {/* 상태 카드 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{currentIndex + 1}</span>
                </div>
                <div>
                  <div className="font-bold text-purple-700 text-sm">
                    {certStage === 'countdown' || fanCertified
                      ? '시청 완료 ✨'
                      : `${currentIndex + 1}번째 영상 시청 중`}
                  </div>
                  <div className="text-purple-600 text-xs">
                    {certStage === 'countdown'
                      ? `${timer}초 후 다음 영상으로 이동합니다`
                      : fanCertified
                        ? '인증이 완료되었습니다!'
                        : '90% 시청하면 자동 인증 후 다음 영상으로 이동'}
                  </div>
                </div>
              </div>
              
              {videoQueue.length > 1 && (
                <div className="text-purple-600 text-xs bg-purple-100 px-2 py-1 rounded-full text-center border border-purple-200">
                  📋 마지막 영상 후 처음부터 반복 재생
                </div>
              )}
            </div>
            
            {/* 유튜브 바로가기 버튼 */}
            <div className="flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const videoId = currentVideo?.videoId || video.videoId;
                  if (videoId) {
                    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    console.error('비디오 ID를 찾을 수 없습니다.');
                    alert('비디오 ID를 찾을 수 없습니다.');
                  }
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold rounded-full px-4 py-2 text-xs shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer"
              >
                <FaYoutube size={14} />
                <span>구독/좋아요 바로가기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
} 