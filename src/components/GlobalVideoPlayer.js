import React, { useEffect, useState } from 'react';
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

  // selectedVideoIdx 변경 시 인증 상태 초기화
  useEffect(() => {
    if (selectedVideoIdx !== null) {
      setIsCertified(false);
      setCertLoading(false);
      setCountdown(0);
      setCertCompleteCountdown(0);
    }
  }, [selectedVideoIdx]);

  // 시청인증 완료 시 자동 인증 및 다음 영상 이동 (바로 인증 후 3초 카운트다운)
  useEffect(() => {
    if (!watchSettings.enabled) return;
    
    // certAvailable 계산 (ChatRoom.js와 동일한 로직)
    let certAvailable = false;
    if (
      selectedVideoIdx !== null &&
      videoList[selectedVideoIdx] &&
      typeof videoList[selectedVideoIdx].duration === "number"
    ) {
      if (watchSettings.watchMode === 'partial') {
        // 부분 시청 허용: 3분 이상 영상은 3분 시청, 3분 미만은 완시청
        certAvailable =
          videoList[selectedVideoIdx].duration >= 180
            ? watchSeconds >= 180
            : videoEnded;
      } else {
        // 전체 시청 필수: 1시간 초과 영상은 30분 시청, 1시간 이하는 30분 시청 또는 완시청, 30분 미만은 완시청
        const videoDuration = videoList[selectedVideoIdx].duration;
        if (videoDuration > 3600) {
          // 1시간 초과 영상: 30분(1800초) 시청으로 인증
          certAvailable = watchSeconds >= 1800;
        } else if (videoDuration > 1800) {
          // 30분~1시간 영상: 30분 시청 또는 완시청
          certAvailable = watchSeconds >= 1800 || videoEnded;
        } else {
          // 30분 미만 영상: 완시청 필요
          certAvailable = videoEnded;
        }
      }
    }

    // 시청인증이 활성화되고, 인증 가능하고, 로딩 중이 아닐 때 바로 인증 처리
    if (watchSettings.enabled && certAvailable && !certLoading && !isCertified) {
      // 바로 인증 처리 (카운트다운은 별도 useEffect에서 처리)
      handleCertify().then(() => {
        // 인증 완료
      }).catch((error) => {
        // 인증 실패 시에도 다음 영상으로 이동 또는 플레이어 종료
        if (selectedVideoIdx < videoList.length - 1) {
          selectVideo(selectedVideoIdx + 1);
        }
      });
    }
  }, [watchSettings.enabled, watchSettings.watchMode, isCertified, certLoading, selectedVideoIdx, videoList.length, watchSeconds, videoEnded]);

  // 인증 횟수가 업데이트되면 카운트다운 시작
  const [lastCertCount, setLastCertCount] = useState(0);
  useEffect(() => {
    // 인증 횟수가 증가했고, 현재 인증된 상태일 때 카운트다운 시작
    if (currentVideoCertCount > lastCertCount && isCertified) {
      setLastCertCount(currentVideoCertCount);
      
      // 3초 카운트다운 시작
      setCertCompleteCountdown(3);
      const completeTimer = setInterval(() => {
        setCertCompleteCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(completeTimer);
            if (selectedVideoIdx < videoList.length - 1) {
              // 다음 영상으로 이동
              selectVideo(selectedVideoIdx + 1);
            } else {
              // 마지막 영상이므로 플레이어 종료
              closePlayer();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (selectedVideoIdx !== null) {
      // 새 영상으로 이동했을 때 현재 인증 횟수로 업데이트
      setLastCertCount(currentVideoCertCount);
    }
  }, [currentVideoCertCount, isCertified, selectedVideoIdx, lastCertCount]);

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
    console.log('🎬 영상 재생 완료');
    setVideoEnded(true);
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

  // certAvailable 계산 - ChatRoom.js와 동일한 로직
  let certAvailable = false;
  if (
    selectedVideoIdx !== null &&
    videoList[selectedVideoIdx] &&
    typeof videoList[selectedVideoIdx].duration === "number" &&
    watchSettings.enabled
  ) {
    if (watchSettings.watchMode === 'partial') {
      // 부분 시청 허용: 3분 이상 영상은 3분 시청, 3분 미만은 완시청
      certAvailable =
        videoList[selectedVideoIdx].duration >= 180
          ? watchSeconds >= 180
          : videoEnded;
    } else {
      // 전체 시청 필수: 1시간 초과 영상은 30분 시청, 1시간 이하는 30분 시청 또는 완시청, 30분 미만은 완시청
      const videoDuration = videoList[selectedVideoIdx].duration;
      if (videoDuration > 3600) {
        // 1시간 초과 영상: 30분(1800초) 시청으로 인증
        certAvailable = watchSeconds >= 1800;
      } else if (videoDuration > 1800) {
        // 30분~1시간 영상: 30분 시청 또는 완시청
        certAvailable = watchSeconds >= 1800 || videoEnded;
      } else {
        // 30분 미만 영상: 완시청 필요
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
            {watchSettings.enabled && certAvailable && countdown > 0 && (
              <div className="text-center mb-2">
                <div className="text-orange-600 font-bold mb-1">
                  🎯 {countdown}초 후 {currentVideoCertCount + 1}번째 인증
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

            {/* 인증완료 후 다음 영상 카운트다운 */}
            {watchSettings.enabled && certCompleteCountdown > 0 && (
              <div className="text-center mb-2">
                <div className="text-green-600 font-bold">
                  ✅ {currentVideoCertCount}번째 인증완료! {certCompleteCountdown}초 후 다음 영상
                </div>
              </div>
            )}

            {/* 현재 시청 상태 표시 */}
            {watchSettings.enabled && countdown === 0 && certCompleteCountdown === 0 && (
              <div className="text-center mb-2">
                <div className={`border rounded-lg px-3 py-2 ${
                  videoEnded && endCountdown > 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`font-medium text-sm ${
                    videoEnded && endCountdown > 0 
                      ? 'text-green-700' 
                      : 'text-blue-700'
                  }`}>
                    {videoEnded && endCountdown > 0 
                      ? `🎉 ${currentVideoCertCount + 1}번째 시청 완료!` 
                      : `📺 ${currentVideoCertCount + 1}번째 시청 중...`
                    }
                  </div>
                  <div className={`text-xs mt-1 ${
                    videoEnded && endCountdown > 0 
                      ? 'text-green-600' 
                      : 'text-blue-600'
                  }`}>
                    {videoEnded && endCountdown > 0 
                      ? `${endCountdown}초 후 다음 영상으로 이동합니다`
                      : (watchSettings.watchMode === 'partial' ? '3분 이상 시청하면 인증됩니다' : '영상을 끝까지 시청하면 인증됩니다')
                    }
                  </div>
                </div>
              </div>
            )}

            {/* 영상 종료 후 다음 영상 카운트다운 (시청인증 비활성화 시) */}
            {!watchSettings.enabled && videoEnded && endCountdown > 0 && (
              <div className="text-center mb-2">
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="text-green-700 font-medium text-sm">
                    🎉 영상 시청 완료!
                  </div>
                  <div className="text-green-600 text-xs mt-1">
                    {endCountdown}초 후 다음 영상으로 이동합니다
                  </div>
                </div>
              </div>
            )}

            {/* 수동 인증 버튼 */}
            {watchSettings.enabled && certAvailable && countdown === 0 && endCountdown === 0 && (
              <div className="text-center mb-2">
                <button
                  onClick={handleCertify}
                  disabled={certLoading}
                  className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm font-medium"
                >
                  {certLoading ? '인증 중...' : `${currentVideoCertCount + 1}번째 시청 인증하기`}
                </button>
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