import React, { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';
import { createPortal } from 'react-dom';
import { useVideoPlayer } from '../contexts/VideoPlayerContext';

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
    resetPlayerState
  } = useVideoPlayer();

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(() => {
    return minimized 
      ? { x: window.innerWidth - 100, y: window.innerHeight - 100 }
      : { x: (window.innerWidth - 400) / 2, y: 50 };
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

  // 유튜브 플레이어 핸들러
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    setPlayerLoading(false);
    setVideoDuration(event.target.getDuration());
  };
  
  const handleYoutubeStateChange = (event) => {
    if (event.data === 1) { // 재생 중
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // 플레이어 닫기
  const closePlayer = () => {
    handleVideoSelect(null);
    resetPlayerState();
  };

  // 유튜브로 이동
  const openInYoutube = () => {
    if (selectedVideoId) {
      const youtubeUrl = `https://www.youtube.com/watch?v=${selectedVideoId}`;
      window.open(youtubeUrl, '_blank');
    }
  };

  // selectedVideoId가 없으면 플레이어를 렌더링하지 않음
  if (!selectedVideoId) {
    console.log('❌ GlobalVideoPlayer: selectedVideoId가 없어서 렌더링하지 않음');
    return null;
  }
  
  console.log('✅ GlobalVideoPlayer: 플레이어 렌더링 시작!', selectedVideoId);

  // Portal을 사용하여 body에 직접 렌더링
  return createPortal(
    <div
      ref={dragRef}
      className={`fixed z-50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${
        minimized ? 'w-20 h-20' : 'w-96 max-w-[90vw]'
      } bg-white rounded-xl shadow-2xl transition-all duration-300`}
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
        // 최소화된 상태
        <div className="w-full h-full relative bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center rounded-xl shadow-lg select-none">
          <div 
            className="text-white text-2xl cursor-pointer hover:scale-110 transition-transform"
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
            title="영상 플레이어 열기"
          >
            ▶️
          </div>
          
          <button
            className="absolute -top-1 -right-1 w-5 h-5 bg-gray-700 text-white rounded-full text-xs hover:bg-gray-800 flex items-center justify-center z-20"
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
            title="닫기"
          >
            ×
          </button>
        </div>
      ) : (
        // 확장된 상태
        <div className="relative bg-white rounded-xl overflow-hidden">
          {/* 상단 헤더 */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-t-xl select-none border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">🎬 YouTube 플레이어</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setMinimized(true);
                }}
                title="최소화"
              >
                −
              </button>
              <button
                className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  closePlayer();
                }}
                title="닫기"
              >
                ×
              </button>
            </div>
          </div>

          {/* YouTube 플레이어 */}
          <div 
            className="relative bg-black youtube-player"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <YouTube
              videoId={selectedVideoId}
              opts={{
                width: '100%',
                height: '216',
                playerVars: { 
                  autoplay: 1,
                  controls: 1,
                  rel: 0,
                  fs: 1,
                }
              }}
              onReady={handleYoutubeReady}
              onStateChange={handleYoutubeStateChange}
              className="w-full"
            />
          </div>

          {/* 하단 액션 버튼 */}
          <div className="p-3 bg-gray-50 rounded-b-xl border-t">
            <div className="flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openInYoutube();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                title="YouTube에서 보기"
              >
                <span>🔗</span>
                <span>YouTube에서 보기</span>
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