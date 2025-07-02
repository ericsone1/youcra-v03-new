import React, { useEffect, useRef, useState } from 'react';
import YouTubePlayerSection from './YouTubePlayerSection';
import { useVideoPlayer } from '../../contexts/VideoPlayerContext';
import { FaBolt, FaYoutube, FaHeart, FaWindowMinimize, FaWindowRestore } from 'react-icons/fa';
import Draggable from 'react-draggable';
import PlayerControlsSection from './PlayerControlsSection';

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
    setVideoEnded,
    fanCertified,
    setFanCertified,
    saveFanCertificationStatus
  } = useVideoPlayer();
  const localPlayerRef = useRef();
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [videoEnded, setLocalVideoEnded] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(false);
  const [actualDuration, setActualDuration] = useState(0);
  const [watchInterval, setWatchInterval] = useState(null);

  // 뷰포트 중앙 위치 계산
  const PLAYER_WIDTH = 400; // max-w-md 기준
  const PLAYER_HEIGHT = 400; // 대략적인 높이
  const getViewportCenterPosition = () => ({
    x: window.scrollX + (window.innerWidth - PLAYER_WIDTH) / 2,
    y: window.scrollY + (window.innerHeight - PLAYER_HEIGHT) / 2,
  });
  const [centerPos, setCenterPos] = useState(getViewportCenterPosition());
  useEffect(() => {
    const handle = () => setCenterPos(getViewportCenterPosition());
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle);
    };
  }, []);

  useEffect(() => {
    setWatchSeconds(0);
    setFanCertified(false);
    setVideoEnded(false);
    setLocalVideoEnded(false);
    setShowCountdown(false);
    setCountdown(5);
    setActualDuration(0);
    
    // 기존 interval 정리
    if (watchInterval) {
      clearInterval(watchInterval);
      setWatchInterval(null);
    }
  }, [video, setFanCertified, setVideoEnded]);

  // 컴포넌트 언마운트 시 interval 정리
  useEffect(() => {
    return () => {
      if (watchInterval) {
        clearInterval(watchInterval);
      }
    };
  }, [watchInterval]);

  useEffect(() => {
    let timer;
    if (showCountdown && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false);
      setCountdown(5);
      if (onCertifyComplete) onCertifyComplete();
    }
    return () => clearTimeout(timer);
  }, [showCountdown, countdown, onCertifyComplete]);

  // 현재 재생할 영상
  const currentVideo = videoQueue.length > 0 ? videoQueue[currentIndex] : video;

  // YouTube onEnd 핸들러
  const handleYoutubeEnd = () => {
    if (videoQueue.length > 0 && currentIndex < videoQueue.length - 1) {
      onNext(currentIndex + 1);
    } else {
      // 마지막 영상이면 플레이어 닫기
      onClose && onClose();
    }
  };

  if (!video) return null;

  // 인증 조건 분기 (실제 길이 또는 전달받은 길이 사용)
  const videoDuration = actualDuration > 0 ? actualDuration : (currentVideo?.duration || 0);
  const isLong = videoDuration >= 180;
  const certAvailable = isLong ? watchSeconds >= 180 : videoEnded;

  // 유튜브 플레이어 이벤트 핸들러
  const handleReady = (event) => {
    playerRef.current = event.target;
    localPlayerRef.current = event.target;
    setWatchSeconds(0);
    setLocalVideoEnded(false);
    // 실제 영상 길이 가져오기 (여러 번 시도)
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
      // 시청 시간 추적 시작
      if (!watchInterval) {
        const newInterval = setInterval(() => {
          if (localPlayerRef.current && localPlayerRef.current.getCurrentTime) {
            const currentTime = Math.floor(localPlayerRef.current.getCurrentTime());
            setWatchSeconds(currentTime);
          }
        }, 1000);
        setWatchInterval(newInterval);
      }
      // playing 상태에서 duration 재시도
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
    if (event.data === 0) {
      setIsPlaying(false);
      setVideoEnded(true);
      setLocalVideoEnded(true);
    }
  };

  const handleCertify = async () => {
    setCertLoading(true);
    // 인증 상태 저장 (로컬)
    setFanCertified(true);
    saveFanCertificationStatus(video.videoId, true);
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

  return (
    <>
      <div className={`fixed z-50 ${minimized ? 'inset-0 flex items-center justify-center' : 'inset-0'} bg-transparent`}>
        <Draggable
          defaultPosition={minimized ? pos : centerPos}
          onStart={() => onDrag(true)}
          onStop={() => {
            onDrag(false);
          }}
        >
          {/* 카드 전체 컨테이너 */}
          <div
            className={
              minimized
                ? 'w-20 h-20 rounded-full shadow-2xl bg-gradient-to-br from-red-500 to-pink-600 border-4 border-white flex items-center justify-center relative'
                : 'bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeInUp relative flex flex-col'
            }
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              transition: 'width 0.3s, height 0.3s, border-radius 0.3s',
              ...(minimized ? {
                padding: 0,
                cursor: 'move',
                pointerEvents: 'auto',
              } : {
                padding: 0,
                pointerEvents: 'auto',
              })
            }}
          >
            {/* 상단바 - minimized일 때 숨김 */}
            <PlayerControlsSection
              minimized={minimized}
              onMinimize={onMinimize}
              onClose={onClose}
            />
            {/* YouTube 플레이어 - 항상 렌더링, minimized 상태는 스타일만 전환 */}
            <div
              className={
                minimized
                  ? 'absolute inset-0 w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 border-4 border-white'
                  : 'w-full aspect-video rounded-lg bg-black overflow-hidden flex items-center justify-center'
              }
              style={{
                opacity: 1,
                pointerEvents: 'auto',
                zIndex: 2,
                transition: 'all 0.3s',
              }}
              onClick={e => {
                if (minimized) {
                  onMinimize(false);
                }
              }}
              onTouchEnd={e => {
                if (minimized) {
                  if (e.changedTouches && e.changedTouches.length > 0) {
                    const x = e.changedTouches[0].clientX;
                    const y = e.changedTouches[0].clientY;
                    onRestore({
                      x: x - PLAYER_WIDTH / 2,
                      y: y - PLAYER_HEIGHT / 2,
                    });
                  }
                  e.preventDefault();
                  onMinimize(false);
                }
              }}
            >
              {/* YouTube 컴포넌트는 항상 렌더링, minimized 상태에 따라 스타일만 전환 */}
              <YouTubePlayerSection
                videoId={currentVideo?.videoId || video.videoId}
                minimized={minimized}
              onReady={handleReady}
              onStateChange={handleStateChange}
                onEnd={handleYoutubeEnd}
                className={minimized ? 'w-20 h-20 rounded-full' : 'w-full h-full object-cover rounded'}
                style={minimized ? { opacity: 0, pointerEvents: 'none' } : {}}
            />
              {/* 미니플레이어 UI - minimized일 때만 보임 */}
              {minimized && (
                <>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-white text-3xl pointer-events-none select-none">▶️</div>
                  <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none select-none z-10 font-medium">
                    {video.title?.substring(0, 25)}...
                  </div>
                  <button
                    className="absolute -top-2 -right-2 w-7 h-7 bg-gray-800 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 hover:bg-red-600 flex items-center justify-center z-10 touch-manipulation font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onClose();
                    }}
                    style={{ touchAction: 'manipulation' }}
                    title="닫기"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
            {/* 정보 카드 등 나머지 UI - minimized일 때 숨김 */}
            {!minimized && (
              <>
                {/* 제목/채널명 통합 영역 */}
                <div className="w-full mt-3 mb-3 px-4 pointer-events-none">
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">🔥</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base leading-tight mb-1" title={video.title}>
                        {video.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        {video.channelTitle || video.channel || '채널명 미표시'}
                      </p>
                    </div>
                  </div>
                </div>
                {/* 시청 정보 카드 */}
                <div className="w-full mb-3 px-4 pointer-events-none">
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-blue-600 font-bold text-sm">{formatTime(watchSeconds)}</div>
                        <div className="text-xs text-gray-500">시청시간</div>
                      </div>
                      <div className="w-px h-8 bg-gray-300"></div>
                      <div className="text-center">
                        <div className="text-gray-600 font-medium text-sm">{formatTime(videoDuration)}</div>
                        <div className="text-xs text-gray-500">전체시간</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600 font-bold text-sm bg-yellow-50 px-2 py-1 rounded-full">
                      <FaBolt size={12}/> 
                      <span>풀시청</span>
                    </div>
                  </div>
            </div>
            {/* 인증 안내 카드 */}
                <div className="w-full bg-blue-100 rounded-xl p-3 flex flex-col items-center mb-2 mx-4 pointer-events-none">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">📺</span>
                <span className="font-bold text-blue-700 text-base">{fanCertified ? '인증 완료' : '1번째 시청 중...'}</span>
              </div>
              <div className="text-blue-700 text-sm font-semibold">
                {fanCertified
                  ? (showCountdown ? `${countdown}초 후 다음 영상으로 이동합니다.` : '인증이 완료되었습니다!')
                      : '끝까지 시청하면 자동 인증됩니다'}
              </div>
            </div>
            {/* 인증 버튼(숨김/비활성화) */}
            <button
              className="hidden"
              style={{ display: 'none' }}
              disabled
            >인증</button>
            {/* 유튜브 이동/구독/좋아요/조회수 */}
                <div className="flex items-center gap-2 mt-2 mb-2 w-full justify-between px-4">
              <a
                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white font-bold rounded-full px-5 py-2 text-sm shadow transition-all duration-200 touch-manipulation cursor-pointer"
                title="유튜브에서 구독/좋아요 바로가기"
                    style={{ touchAction: 'manipulation' }}
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
              >
                <FaYoutube className="inline"/> 구독/좋아요 바로가기
              </a>
                  <div className="flex-1" />
              </div>
              </>
            )}
          </div>
        </Draggable>
      </div>
    </>
  );
} 