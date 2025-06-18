import React, { useEffect } from 'react';
import YouTube from 'react-youtube';
import { useVideoPlayer } from '../contexts/VideoPlayerContext';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

function GlobalVideoPlayer() {
  const {
    selectedVideoIdx,
    setSelectedVideoIdx,
    videoList,
    roomId,
    minimized,
    setMinimized,
    popupPos,
    setPopupPos,
    dragging,
    setDragging,
    watchSeconds,
    setWatchSeconds,
    lastPlayerTime,
    setLastPlayerTime,
    videoEnded,
    setVideoEnded,
    isCertified,
    setIsCertified,
    certLoading,
    setCertLoading,
    countdown,
    setCountdown,
    endCountdown,
    setEndCountdown,
    watchSettings,
    certifiedVideoIds,
    playerRef,
    autoNextTimer,
    endTimer,
    dragOffset,
    closePlayer
  } = useVideoPlayer();

  // 플레이어가 활성화되어 있지 않으면 렌더링하지 않음
  if (selectedVideoIdx === null || !videoList[selectedVideoIdx]) {
    return null;
  }

  // 드래그 핸들러
  const handleDragStart = (e) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

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
    if (e.cancelable) e.preventDefault();

    if (!dragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragOffset.current.x;
    const newY = clientY - dragOffset.current.y;
    
    // 화면 경계 체크 - 전체 화면으로 확장, 상단 헤더 겹침 방지
    const popupWidth = minimized ? 80 : 400;
    const popupHeight = minimized ? 80 : 500;
    const maxX = window.innerWidth - popupWidth;
    const maxY = window.innerHeight - popupHeight;
    const minY = 60; // 상단 헤더 밑으로 들어가지 않도록 60px 여백
    
    setPopupPos({
      x: Math.max(0, Math.min(newX, maxX)), // 왼쪽 끝까지 허용
      y: Math.max(minY, Math.min(newY, maxY)), // 상단 헤더 아래로만 허용
    });
  };
  
  const handleDragEnd = () => {
    if (event?.stopPropagation) event.stopPropagation();
    setDragging(false);
  };

  // 유튜브 플레이어 핸들러
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    setWatchSeconds(0);
    setLastPlayerTime(0);
    setVideoEnded(false);
  };
  
  const handleYoutubeStateChange = (event) => {
    // 기존 interval 정리
    if (playerRef.current && playerRef.current._interval) {
      clearInterval(playerRef.current._interval);
      playerRef.current._interval = null;
    }

    // 재생 중일 때만 새로운 interval 생성
    if (event.data === 1) { // YT.PlayerState.PLAYING
      playerRef.current._interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          setWatchSeconds(Math.floor(currentTime));
        } else {
          // 기본 카운터 (플레이어 API 접근 불가 시)
          setWatchSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
  };
  
  const handleYoutubeEnd = () => {
    console.log('🎬 영상 끝남 감지:', {
      selectedVideoIdx,
      videoListLength: videoList.length,
      hasNext: selectedVideoIdx < videoList.length - 1
    });
    
    // 영상 종료 시 interval 정리
    if (playerRef.current && playerRef.current._interval) {
      clearInterval(playerRef.current._interval);
      playerRef.current._interval = null;
    }
    
    // 영상 종료 시 videoEnded 상태 설정
    setVideoEnded(true);
    
    // 시청인증이 비활성화되어 있다면 바로 다음 영상으로 이동
    if (!watchSettings.enabled) {
      if (selectedVideoIdx < videoList.length - 1) {
        console.log('⏰ 다음 영상 카운트다운 시작 (시청인증 비활성)');
        setEndCountdown(3);
        endTimer.current = setInterval(() => {
          setEndCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(endTimer.current);
              console.log('➡️ 다음 영상으로 이동:', selectedVideoIdx + 1);
              setSelectedVideoIdx(selectedVideoIdx + 1);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        console.log('📺 마지막 영상 완료');
      }
    }
  };

  // 인증 핸들러
  const handleCertify = async () => {
    if (!roomId) return;
    
    setCertLoading(true);
    const video = videoList[selectedVideoIdx];
    try {
      await addDoc(
        collection(db, "chatRooms", roomId, "videos", video.id, "certifications"),
        {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          certifiedAt: serverTimestamp(),
        }
      );
      setIsCertified(true);
    } catch (error) {
      console.error('인증 오류:', error);
    }
    setCertLoading(false);
  };

  // certAvailable 계산
  let certAvailable = false;
  if (
    selectedVideoIdx !== null &&
    videoList[selectedVideoIdx] &&
    typeof videoList[selectedVideoIdx].duration === "number" &&
    watchSettings.enabled
  ) {
    const videoDuration = videoList[selectedVideoIdx].duration;
    
    if (watchSettings.watchMode === 'partial') {
      // 부분 시청 허용: 3분 기준 조건
      if (videoDuration >= 180) {
        // 3분 이상 영상: 3분(180초) 시청 후 인증 가능
        certAvailable = watchSeconds >= 180;
      } else {
        // 3분 미만 영상: 끝까지 시청 후 인증 가능
        certAvailable = videoEnded;
      }
    } else {
      // 전체 시청 필수: 30분 초과 영상도 최대 30분까지만 시청
      if (videoDuration > 1800) {
        certAvailable = watchSeconds >= 1800;
      } else {
        certAvailable = videoEnded;
      }
    }
  }

  return (
    <div
      className={`fixed z-20 bg-white rounded-xl shadow-lg transition-all duration-300 ${
        minimized ? 'w-16 h-16' : 'w-96 max-w-[90vw]'
      }`}
      style={{
        top: popupPos.y,
        left: popupPos.x,
        cursor: dragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDrag}
      onTouchEnd={handleDragEnd}
    >
      {/* YouTube 플레이어 */}
      <div 
        className={`absolute transition-all duration-300 ${
          minimized 
            ? 'hidden'
            : 'w-full top-12 left-0'
        }`}
        style={{ 
          pointerEvents: minimized ? 'none' : 'auto',
          zIndex: 15
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {videoList[selectedVideoIdx]?.videoId ? (
          <YouTube
            key={videoList[selectedVideoIdx].videoId}
            videoId={videoList[selectedVideoIdx].videoId}
            opts={{
              width: '100%',
              height: minimized ? '64' : '200',
              playerVars: { 
                autoplay: 1,
                controls: 1,
                rel: 0,
                fs: 1,
              }
            }}
            onReady={handleYoutubeReady}
            onStateChange={handleYoutubeStateChange}
            onEnd={handleYoutubeEnd}
            className="rounded"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
            ⚠️ 영상 로딩 중...
          </div>
        )}
      </div>

      {/* UI 오버레이 */}
      <div className={`relative z-10 ${minimized ? 'w-full h-full' : 'p-3'}`}>
        {minimized ? (
          // 최소화된 상태
          <div className="w-full h-full relative bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center rounded-xl shadow-lg select-none">
            {/* 영상 아이콘 */}
            <div 
              className="text-white text-2xl cursor-pointer hover:scale-110 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setMinimized(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              title="영상 플레이어 열기"
            >
              ▶️
            </div>
            
            {/* 닫기 버튼 */}
            <button
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center z-20"
              onClick={(e) => {
                e.stopPropagation();
                closePlayer();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              title="닫기"
            >
              ×
            </button>
          </div>
        ) : (
          // 확장된 상태
          <div>
            {/* 상단 헤더 */}
            <div className="flex justify-between items-center mb-1 p-3 -m-3 rounded-t-xl bg-gray-50 select-none" title="드래그해서 이동">
              <div className="flex-1 text-center text-xs text-gray-500 font-medium">
                영상 플레이어 (드래그 가능)
              </div>
              
              {/* 우측 버튼 그룹 */}
              <div className="flex items-center gap-1">
                <button
                  className="text-lg text-blue-500 hover:text-blue-700 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMinimized(true);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  title="최소화"
                >
                  ➖
                </button>
                
                <button
                  className="text-xl text-gray-400 hover:text-gray-700 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    closePlayer();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  title="닫기"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* 영상 공간 */}
            <div className="mb-2" style={{ height: '200px', pointerEvents: 'none' }}>
              {/* YouTube 플레이어가 여기 위에 absolute로 위치함 */}
            </div>
            
            {/* 제목 */}
            <div 
              className="font-bold text-sm mb-2 px-1" 
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}
              title={videoList[selectedVideoIdx].title}
            >
              {videoList[selectedVideoIdx].title}
            </div>
            
            {/* 시청 시간과 인증 정보 */}
            <div className="flex flex-col gap-1 text-xs text-gray-600 mb-2 px-1">
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-medium">
                  시청 시간: {Math.floor(watchSeconds / 60)}:{(watchSeconds % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-gray-500">
                  {videoList[selectedVideoIdx]?.duration ? 
                    `전체: ${Math.floor(videoList[selectedVideoIdx].duration / 60)}:${(videoList[selectedVideoIdx].duration % 60).toString().padStart(2, '0')}` 
                    : ''}
                </span>
              </div>
              
              {/* 시청인증 설정 표시 */}
              <div className="text-center">
                {watchSettings.enabled ? (
                  <span className="text-purple-600 font-medium">
                    {watchSettings.watchMode === 'partial' ? '⚡ 부분시청' : '🎯 풀시청'} 모드
                  </span>
                ) : (
                  <span className="text-gray-500">시청인증 비활성화</span>
                )}
              </div>
            </div>

            {/* 카운트다운 및 인증 버튼 */}
            {watchSettings.enabled && certAvailable && !isCertified && countdown > 0 && (
              <div className="text-center mb-2">
                <div className="text-orange-600 font-bold mb-1">
                  🎯 {countdown}초 후 자동 인증
                </div>
              </div>
            )}

            {/* 다음 영상 카운트다운 */}
            {!watchSettings.enabled && endCountdown > 0 && (
              <div className="text-center mb-2">
                <div className="text-blue-600 font-bold">
                  ➡️ {endCountdown}초 후 다음 영상
                </div>
              </div>
            )}

            {/* 수동 인증 버튼 */}
            {watchSettings.enabled && certAvailable && !isCertified && countdown === 0 && (
              <div className="text-center mb-2">
                <button
                  onClick={handleCertify}
                  disabled={certLoading}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm font-medium"
                >
                  {certLoading ? '인증 중...' : '시청 인증하기'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalVideoPlayer; 