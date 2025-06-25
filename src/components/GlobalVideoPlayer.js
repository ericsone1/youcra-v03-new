import React, { useEffect, useState, useCallback, useMemo } from 'react';
import YouTube from 'react-youtube';
import { useVideoPlayer } from '../contexts/VideoPlayerContext';
import { doc, addDoc, collection, serverTimestamp, onSnapshot, query, where, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';

function GlobalVideoPlayer() {
  const {
    selectedVideoIdx,
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
    certCompleteCountdown,
    setCertCompleteCountdown,
    watchSettings,
    setWatchSettings,
    certifiedVideoIds,
    setCertifiedVideoIds,
    currentVideoCertCount,
    setCurrentVideoCertCount,
    liked,
    setLiked,
    likeCount,
    setLikeCount,
    watching,
    setWatching,
    playerRef,
    autoNextTimer,
    endTimer,
    dragOffset,
    closePlayer,
    selectVideo
  } = useVideoPlayer();

  const { user } = useAuth();
  
  // 현재 영상의 인증 횟수 실시간 구독
  useEffect(() => {
    if (!roomId || !auth.currentUser || selectedVideoIdx === null || !videoList[selectedVideoIdx]) {
      setCurrentVideoCertCount(0);
      return;
    }

    const currentVideo = videoList[selectedVideoIdx];
    const q = query(
      collection(db, "chatRooms", roomId, "videos", currentVideo.id, "certifications"),
      where("uid", "==", auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCurrentVideoCertCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [roomId, selectedVideoIdx, videoList, auth.currentUser]);

  // 인증 핸들러
  const handleCertify = useCallback(async () => {
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
      
      // 인증 완료 후 바로 5초 카운트다운 시작
      setCertCompleteCountdown(5);
      const completeTimer = setInterval(() => {
        setCertCompleteCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(completeTimer);
            if (selectedVideoIdx < videoList.length - 1) {
              // 다음 영상으로 이동
              selectVideo(selectedVideoIdx + 1);
            } else {
              // 마지막 영상이므로 첫 번째 영상으로 이동 (반복 재생)
              selectVideo(0);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('인증 오류:', error);
    }
    setCertLoading(false);
  }, [roomId, selectedVideoIdx, videoList, selectVideo, closePlayer]);

  // selectedVideoIdx 변경 시 모든 상태 초기화
  useEffect(() => {
    if (selectedVideoIdx !== null) {
      // 기존 타이머들 정리
      if (endTimer.current) {
        clearInterval(endTimer.current);
        endTimer.current = null;
      }
      if (autoNextTimer.current) {
        clearInterval(autoNextTimer.current);
        autoNextTimer.current = null;
      }
      
      // 상태 초기화
      setIsCertified(false);
      setCertLoading(false);
      setCountdown(0);
      setCertCompleteCountdown(0);
      setWatchSeconds(0);
      setVideoEnded(false);
      setEndCountdown(0);
      setLastPlayerTime(0);
    }
  }, [selectedVideoIdx]);

  // certAvailable 계산: 렌더링 및 useEffect에서 모두 사용
  const certAvailable = useMemo(() => {
    if (
      selectedVideoIdx === null ||
      !videoList[selectedVideoIdx] ||
      typeof videoList[selectedVideoIdx].duration !== 'number'
    ) {
      return false;
    }

    if (roomId === 'watchqueue') {
      // 홈탭: 무조건 풀시청
      return videoEnded;
    }

    if (watchSettings.watchMode === 'partial') {
      const minWatchTime = Math.min(30, videoList[selectedVideoIdx].duration * 0.8);
      return videoList[selectedVideoIdx].duration >= 180
        ? watchSeconds >= 180
        : videoEnded && watchSeconds >= minWatchTime;
    }

    // watchMode === 'full'
    const videoDuration = videoList[selectedVideoIdx].duration;
    if (videoDuration > 3600) {
      return watchSeconds >= 1800;
    } else if (videoDuration > 1800) {
      return watchSeconds >= 1800 || videoEnded;
    } else {
      const minWatchTime = Math.min(30, videoDuration * 0.8);
      return videoEnded && watchSeconds >= minWatchTime;
    }
  }, [roomId, watchSettings.watchMode, videoEnded, watchSeconds, selectedVideoIdx, videoList]);

  // 시청인증 완료 시 자동 인증 및 다음 영상 이동 (바로 인증 후 5초 카운트다운)
  useEffect(() => {
    if (!watchSettings.enabled) return;
    
    if (certAvailable && !certLoading && !isCertified && watchSeconds > 0) {
      handleCertify().catch((error) => {
        // 인증 실패 시에도 다음 영상으로 이동 (반복 재생)
        if (selectedVideoIdx < videoList.length - 1) {
          selectVideo(selectedVideoIdx + 1);
        } else {
          selectVideo(0);
        }
      });
    }
  }, [certAvailable, isCertified, certLoading, watchSeconds, handleCertify, videoList.length, selectedVideoIdx]);

  // 영상 선택 시 좋아요 상태 초기화
  useEffect(() => {
    if (selectedVideoIdx !== null) {
      setLiked(false);
      setLikeCount(Math.floor(Math.random() * 500) + 50); // 50-550 랜덤 좋아요 수
      setWatching(Math.floor(Math.random() * 1000) + 100); // 100-1100 랜덤 시청자 수
    }
  }, [selectedVideoIdx]);

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
    setIsCertified(false);
    setEndCountdown(0);
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
    setVideoEnded(true);
    
    // 시청인증이 비활성화된 경우에만 바로 카운트다운 시작
    if (!watchSettings.enabled) {
    setEndCountdown(5); // 5초 카운트다운 시작
    
    // 5초 카운트다운 타이머
    let countdown = 5;
    endTimer.current = setInterval(() => {
      countdown--;
      setEndCountdown(countdown);
      
      if (countdown <= 0) {
        clearInterval(endTimer.current);
        endTimer.current = null;
        
        // 다음 영상으로 이동
        const nextIdx = selectedVideoIdx + 1;
        if (nextIdx < videoList.length) {
          // 다음 영상이 있으면 이동
          selectVideo(nextIdx);
        } else {
          // 마지막 영상이면 처음 영상으로 이동
          selectVideo(0);
        }
      }
    }, 1000);
    }
    // 시청인증이 활성화된 경우, 자동 인증 useEffect에서 처리됨
  };

  // 페이지 스크롤 잠금: 드래그 중에는 body 스크롤 금지
  useEffect(() => {
    if (dragging) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [dragging]);

  return (
    <div
      className={`fixed z-20 bg-white rounded-xl shadow-lg transition-all duration-300 ${
        minimized ? 'w-16 h-16' : 'w-96 max-w-[90vw]'
      }`}
      style={{
        top: popupPos.y,
        left: popupPos.x,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none' // 드래그 중 배경 스크롤 방지
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
                🔄 영상 플레이어 (반복재생) - 드래그 가능
              </div>
              
              {/* 우측 버튼 그룹 */}
              <div className="flex items-center gap-1">
                <button
                  className="text-lg text-blue-500 hover:text-blue-700 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMinimized(true);
                  }}
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
                    {(roomId === 'watchqueue' || watchSettings.watchMode !== 'partial') ? '🎯 풀시청' : '⚡ 부분시청'} 모드
                  </span>
                ) : (
                  <span className="text-gray-500">시청인증 비활성화</span>
                )}
              </div>
            </div>

            {/* 카운트다운 및 인증 버튼 */}
            {watchSettings.enabled && certAvailable && countdown > 0 && (
              <div className="text-center mb-2">
                <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-xl px-4 py-3 shadow-lg">
                  <div className="text-lg font-bold mb-1">
                  🎯 {countdown}초 후 {currentVideoCertCount + 1}번째 인증
                  </div>
                  <div className="mt-2 bg-white bg-opacity-20 rounded-full h-1">
                    <div 
                      className="bg-white h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* 다음 영상 카운트다운 */}
            {!watchSettings.enabled && endCountdown > 0 && (
              <div className="text-center mb-2">
                <div className="bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-xl px-4 py-3 shadow-lg">
                  <div className="text-lg font-bold mb-1">
                    ➡️ 다음 영상으로 이동
                  </div>
                  <div className="text-sm opacity-90">
                    {endCountdown}초 후 {selectedVideoIdx < videoList.length - 1 ? '다음 영상으로 이동' : '첫 번째 영상으로 이동 (반복재생)'}
                  </div>
                  <div className="mt-2 bg-white bg-opacity-20 rounded-full h-1">
                    <div 
                      className="bg-white h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${((5 - endCountdown) / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* 인증완료 후 다음 영상 카운트다운 */}
            {watchSettings.enabled && certCompleteCountdown > 0 && (
              <div className="text-center mb-2">
                <div className="bg-gradient-to-r from-green-400 to-blue-400 text-white rounded-xl px-4 py-3 shadow-lg animate-pulse">
                  <div className="text-lg font-bold mb-1">
                    🎉 {currentVideoCertCount}번째 시청완료!
                  </div>
                  <div className="text-sm opacity-90">
                    {certCompleteCountdown}초 후 {selectedVideoIdx < videoList.length - 1 ? '다음 영상으로 이동' : '첫 번째 영상으로 이동 (반복재생)'}
                  </div>
                  <div className="mt-2 bg-white bg-opacity-20 rounded-full h-1">
                    <div 
                      className="bg-white h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${((5 - certCompleteCountdown) / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* 현재 시청 상태 표시 */}
            {watchSettings.enabled && countdown === 0 && certCompleteCountdown === 0 && (
              <div className="text-center mb-2">
                <div className={`rounded-xl px-4 py-3 shadow-md ${
                  (certAvailable || isCertified)
                    ? 'bg-gradient-to-r from-emerald-400 to-green-400 text-white' 
                    : 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white'
                }`}>
                  <div className="text-lg font-bold mb-1">
                    {(certAvailable || isCertified)
                      ? `🎉 ${currentVideoCertCount + (isCertified ? 0 : 1)}번째 시청 완료!` 
                      : `📺 ${currentVideoCertCount + 1}번째 시청 중...`
                    }
                  </div>
                  <div className="text-sm opacity-90">
                    {(certAvailable || isCertified)
                      ? (isCertified ? '인증완료! 잠시만 기다려주세요...' : '인증 처리중...')
                      : (roomId === 'watchqueue'
                          ? '영상을 끝까지 시청하면 인증됩니다'
                          : (watchSettings.watchMode === 'partial'
                              ? '3분 시청하면 자동 인증됩니다'
                              : '영상을 끝까지 시청하면 인증됩니다'))
                    }
                  </div>
                </div>
              </div>
            )}

            {/* 영상 종료 후 다음 영상 카운트다운 (시청인증 비활성화 시) */}
            {!watchSettings.enabled && videoEnded && endCountdown > 0 && (
              <div className="text-center mb-2">
                <div className="bg-gradient-to-r from-green-400 to-teal-400 text-white rounded-xl px-4 py-3 shadow-lg">
                  <div className="text-lg font-bold mb-1">
                    🎉 영상 시청 완료!
                  </div>
                  <div className="text-sm opacity-90">
                    {endCountdown}초 후 {selectedVideoIdx < videoList.length - 1 ? '다음 영상으로 이동' : '첫 번째 영상으로 이동 (반복재생)'}
                  </div>
                  <div className="mt-2 bg-white bg-opacity-20 rounded-full h-1">
                    <div 
                      className="bg-white h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${((5 - endCountdown) / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}


            {/* 구독/좋아요 버튼 영역 */}
            <div className="flex items-center justify-start gap-2 mt-2 px-1">
              {/* 통합 구독/좋아요 바로가기 버튼 */}
              <button
                onClick={() => {
                  const videoUrl = `https://www.youtube.com/watch?v=${videoList[selectedVideoIdx]?.videoId}`;
                  window.open(videoUrl, '_blank');
                }}
                className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors shadow-md flex items-center gap-1"
                title="YouTube에서 구독/좋아요하기"
              >
                🔔❤️ 구독/좋아요 바로가기
              </button>
              
              {/* 시청자 수 */}
              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md whitespace-nowrap">
                👁️ {watching}명
              </div>
            </div>


          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalVideoPlayer; 