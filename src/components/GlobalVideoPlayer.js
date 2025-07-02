import React, { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';
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

  // =====================
  // 위치 / 최소화 드래그 상태
  // =====================
  const [popupPos, setPopupPos] = useState(() => ({
    x: (window.innerWidth - 400) / 2,
    y: (window.innerHeight - 500) / 2,
  }));
  const [minimized, setMinimized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // minimized 변경 시 중앙으로 위치 재설정
  useEffect(() => {
    if (minimized) {
      setPopupPos({
        x: (window.innerWidth - 80) / 2,
        y: (window.innerHeight - 80) / 2,
      });
    }
  }, [minimized]);

  // 드래그 핸들러
  const handleDragStart = (e) => {
    e.stopPropagation();
    setDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragOffset.current = {
      x: clientX - popupPos.x,
      y: clientY - popupPos.y,
    };
  };
  
  const handleDrag = (e) => {
    e.stopPropagation();
    if (!dragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragOffset.current.x;
    const newY = clientY - dragOffset.current.y;
    
    // 화면 경계 체크
    const popupWidth = minimized ? 80 : 400;
    const popupHeight = minimized ? 80 : 350; // 높이 줄임
    const maxX = window.innerWidth - popupWidth;
    const maxY = window.innerHeight - popupHeight;
    const minY = 60;
    
    setPopupPos({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY)),
    });
  };
  
  const handleDragEnd = () => {
    setDragging(false);
  };

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

  // 페이지 스크롤 잠금
  useEffect(() => {
    if (dragging) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [dragging]);

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

  return (
    <div
      className={`fixed z-50 bg-white rounded-xl shadow-2xl transition-all duration-300 ${
        minimized ? 'w-20 h-20' : 'w-96 max-w-[90vw]'
      }`}
      style={{
        top: popupPos.y,
        left: popupPos.x,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none'
      }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDrag}
      onTouchEnd={handleDragEnd}
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
            className="relative bg-black"
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
    </div>
  );
}

export default GlobalVideoPlayer; 