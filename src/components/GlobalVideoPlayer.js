import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useVideoPlayer } from '../contexts/VideoPlayerContext';
import { FaBolt, FaYoutube, FaPlay, FaFire, FaMinus, FaSpinner } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import YouTubePlayerSection from './Home/YouTubePlayerSection';
import { useWatchedVideos } from '../contexts/WatchedVideosContext';
import { auth } from '../firebase';

function GlobalVideoPlayer() {
  const {
    selectedVideoId,
    isPlaying,
    setIsPlaying,
    playerLoading,
    setPlayerLoading,
    videoDuration,
    setVideoDuration,
    playerRef,
    handleVideoSelect,
    resetPlayerState,
    initializePlayer,
    currentRoomId,
    videoList,
    currentIndex,
  } = useVideoPlayer();

  // Watched videos context
  const { incrementWatchCount, setCertified, getWatchInfo } = useWatchedVideos();

  console.log('🎮 GlobalVideoPlayer 렌더링:', { 
    selectedVideoId, 
    playerLoading,
    isPlaying,
    videoDuration,
    timestamp: new Date().toLocaleTimeString()
  });
  
  // selectedVideoId 변경 감지
  useEffect(() => {
    console.log('🔄 GlobalVideoPlayer - selectedVideoId 변경됨:', {
      selectedVideoId,
      playerLoading,
      isPlaying,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [selectedVideoId]);

  // 위치 / 최소화 드래그 상태 (HomeVideoPlayer 방식)
  const [minimized, setMinimized] = useState(false);
  // 다음 영상으로 넘어가는 중 상태
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(() => {
    return minimized 
      ? { x: window.innerWidth - 100, y: window.innerHeight - 100 }
      : { x: (window.innerWidth - 400) / 2, y: (window.innerHeight - 350) / 2 };
  });

  const dragRef = useRef();

  // 마우스 드래그 핸들러 (HomeVideoPlayer와 동일)
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
    const playerHeight = minimized ? 80 : 350;
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
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    const playerWidth = minimized ? 80 : 400;
    const playerHeight = minimized ? 80 : 350;
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
    }
  };

  // 전역 이벤트 리스너 등록 (HomeVideoPlayer와 동일)
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

  // minimized 변경 시 위치 조정
  useEffect(() => {
    if (minimized) {
      setPosition({
        x: window.innerWidth - 100,
        y: window.innerHeight - 100,
      });
    } else {
      setPosition({
        x: (window.innerWidth - 400) / 2,
        y: 50,
      });
    }
  }, [minimized]);

  // ▶️ YouTube 이벤트 핸들러 (VideoPlayer로 전달)
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    setPlayerLoading(false);
    setVideoDuration(event.target.getDuration());
    // 새 영상이 준비되면 카운터를 1초부터 시작
    setWatchSeconds(1);
    // 전환 메시지 해제
    setIsTransitioning(false);
  };
  
  const handleYoutubeStateChange = (event) => {
    if (event.data === 1) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleYoutubeEnd = async () => {
    setIsPlaying(false);

    // 다음 영상으로 넘어가는 중임을 UI에 표시
    setIsTransitioning(true);

    // 시청 완료 처리 (인증 + watchCount 증가)
    const finishedVideoId = currentVideo?.videoId || selectedVideoId;
    if (finishedVideoId) {
      try {
        await Promise.all([
          incrementWatchCount(finishedVideoId),
          setCertified(finishedVideoId, true, 'main')
        ]);
      } catch (e) {
        console.error('watchCount 업데이트 실패', e);
      }
    }

    // 자동 다음 영상 이동 로직
    if (videoList && videoList.length > 0) {
      const nextIdx = currentIndex + 1;
      // 다음 영상이 있으면 재생, 없으면 플레이어 종료
      if (nextIdx < videoList.length) {
        console.log('🎬 영상 종료 → 다음 영상으로 이동', { nextIdx });
        initializePlayer(currentRoomId || 'home', videoList, nextIdx);
      } else {
        console.log('🏁 마지막 영상 시청 완료 → 플레이어 종료');
        handleVideoSelect(null);
        resetPlayerState();
        setIsTransitioning(false);
      }
    } else {
      // 리스트가 없으면 단일 영상이었으므로 종료
      handleVideoSelect(null);
      resetPlayerState();
      setIsTransitioning(false);
    }
  };

  // ⏱️ 시청 시간 추적
  const [watchSeconds, setWatchSeconds] = useState(0);
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setWatchSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isPlaying && watchSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 영상이 바뀔 때 시청 시간 초기화 (영상 ID가 바뀔 때만)
  useEffect(() => {
    setWatchSeconds(0);
  }, [selectedVideoId]); // 영상 ID만 의존성으로 설정

  // 플레이어 닫기
  const closePlayer = () => {
    handleVideoSelect(null);
    resetPlayerState();
  };

  // 유튜브로 이동 (VideoPlayer 내부 버튼 사용 예정이지만 fallback 유지)
  const openInYoutube = () => {
    if (selectedVideoId) {
      window.open(`https://www.youtube.com/watch?v=${selectedVideoId}`, '_blank');
    }
  };

  // selectedVideoId가 없으면 플레이어를 렌더링하지 않음
  if (!selectedVideoId) {
    console.log('❌ GlobalVideoPlayer: selectedVideoId가 없어서 렌더링하지 않음');
    return null;
  }
  
  console.log('✅ GlobalVideoPlayer: 플레이어 렌더링 시작!', selectedVideoId);

  // 현재 재생할 영상
  const currentVideo = videoList && videoList.length > 0 && currentIndex >= 0 && currentIndex < videoList.length 
    ? videoList[currentIndex] 
    : { videoId: selectedVideoId, title: '영상', channelTitle: '채널명' };

  // 시청 회수 정보 가져오기
  const watchInfo = getWatchInfo(currentVideo.videoId || currentVideo.id || selectedVideoId);
  const watchCountDisplay = (watchInfo.watchCount || 0).toLocaleString();

  // 시간 포맷팅 함수
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

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
              setMinimized(false);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setMinimized(false);
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
              closePlayer();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              closePlayer();
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
                  setMinimized(true);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                title="최소화"
              >
                <FaMinus className="text-gray-500 text-sm" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closePlayer();
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
              videoId={currentVideo?.videoId || selectedVideoId}
              minimized={false}
              onReady={handleYoutubeReady}
              onStateChange={handleYoutubeStateChange}
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
                <h3 className="font-bold text-base leading-tight text-gray-900 mb-1" title={currentVideo.title}>
                  {currentVideo.title}
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  {currentVideo.channelTitle || currentVideo.channel || '채널명'}
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
              
              {/* 진행률 게이지·퍼센트 텍스트 제거 */}
            </div>
            
            {/* 상태 카드 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{currentIndex + 1}</span>
                </div>
                <div>
                  {/* 시청 회수 및 안내 문구 수정 */}
                  <div className="font-bold text-purple-700 text-sm">
                    이 영상 시청 회수 {watchCountDisplay}회
                  </div>
                  <div className="text-purple-600 text-xs">
                    영상이 끝나면 다음 영상으로 이동합니다
                  </div>
                  {isTransitioning && (
                    <div className="mt-1 flex items-center gap-2 text-blue-600 text-xs">
                      <FaSpinner className="animate-spin" size={12} />
                      <span>다음 영상으로 이동 중입니다...</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 반복 재생 안내 문구 제거 */}
            </div>
            
            {/* 유튜브 바로가기 버튼 */}
            <div className="flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const videoId = currentVideo?.videoId || selectedVideoId;
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

export default GlobalVideoPlayer; 