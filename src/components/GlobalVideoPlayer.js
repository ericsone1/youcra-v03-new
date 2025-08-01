import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useVideoPlayer } from '../contexts/VideoPlayerContext';
import { FaBolt, FaYoutube, FaPlay, FaFire, FaMinus, FaSpinner, FaExpand } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import YouTubePlayerSection from './Home/YouTubePlayerSection';
import { useWatchedVideos } from '../contexts/WatchedVideosContext';
import { useWatchTime } from '../hooks/useWatchTime';
import TokenNotification from './common/TokenNotification';
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

  // 토큰 알림 상태
  const [tokenNotification, setTokenNotification] = useState(null);

  // 토큰 획득 콜백
  const handleTokenEarned = (tokenData) => {
    console.log('🪙 [GlobalVideoPlayer] 토큰 획득!', tokenData);
    setTokenNotification(tokenData);
    
    // 3초 후 알림 닫기
    setTimeout(() => {
      setTokenNotification(null);
    }, 3000);
  };

  // 시청 시간 추적 및 토큰 적립
  const { flushWatchTime } = useWatchTime(selectedVideoId, isPlaying, handleTokenEarned);

  // 위치 / 최소화 드래그 상태 (HomeVideoPlayer 방식)
  const [minimized, setMinimized] = useState(false);
  // 다음 영상으로 넘어가는 중 상태
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // 드래그 여부 플래그 (드래그 후 클릭 구분)
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(() => {
    return minimized 
      ? { x: window.innerWidth - 100, y: window.innerHeight - 100 }
      : { x: (window.innerWidth - 300) / 2, y: (window.innerHeight - 250) / 2 };
  });
  
  // 자동 재생 실패 상태 추가
  const [autoplayFailed, setAutoplayFailed] = useState(false);

  console.log('🎮 GlobalVideoPlayer 렌더링:', { 
    selectedVideoId, 
    playerLoading,
    isPlaying,
    videoDuration,
    autoplayFailed,
    브라우저: navigator.userAgent.split(' ').pop(), // 간단한 브라우저 정보
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

  const dragRef = useRef();

  // 마우스 드래그 핸들러 (HomeVideoPlayer와 동일)
  const handleMouseDown = (e) => {
    // 버튼이나 YouTube 플레이어 영역 클릭 시 드래그 방지
    if (e.target.closest('button') || e.target.closest('iframe') || e.target.closest('.youtube-player')) {
      return;
    }
    
    e.preventDefault();
    setHasDragged(false);
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
    const playerWidth = minimized ? 80 : 300;
    const playerHeight = minimized ? 80 : 250;
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

      // 드래그 종료 후 약간의 지연 후 hasDragged 리셋
      setTimeout(() => setHasDragged(false), 50);
    }
  };

  // 터치 이벤트 핸들러 (모바일)
  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('iframe') || e.target.closest('.youtube-player')) {
      return;
    }
    
    setHasDragged(false);
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
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
      setTimeout(() => setHasDragged(false), 50);
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
        x: (window.innerWidth - 80) / 2,
        y: (window.innerHeight - 80) / 2,
      });
    } else {
      setPosition({
        x: (window.innerWidth - 300) / 2,
        y: 50,
      });
    }
  }, [minimized]);

  // ▶️ YouTube 이벤트 핸들러 (VideoPlayer로 전달)
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    setPlayerLoading(false);
    setVideoDuration(event.target.getDuration());
    
    // 환경 정보 로깅 (문제 진단용)
    console.log('🎬 플레이어 준비 완료 - 환경 정보:', {
      브라우저: navigator.userAgent,
      모바일: /Mobi|Android/i.test(navigator.userAgent),
      iOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      크롬: /Chrome/.test(navigator.userAgent),
      사파리: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
      현재시간: new Date().toLocaleTimeString()
    });
    
    // 모바일/데스크톱에 따른 다른 전략 적용
    const isMobile = /Mobi|Android|iPad|iPhone|iPod/i.test(navigator.userAgent);
    
    if (isMobile) {
      // 모바일: 더 보수적인 접근
      console.log('📱 모바일 환경 감지 - 보수적 자동재생 시도');
      setTimeout(() => {
        try {
          // 모바일에서는 음소거 상태에서 시작
          event.target.playVideo();
          console.log('📱 모바일 자동 재생 시도 (음소거 상태)');
          
          // 재생이 시작되면 잠시 후 음소거 해제 시도 (모바일은 더 보수적으로)
          setTimeout(() => {
            try {
              if (event.target.isMuted()) {
                event.target.unMute();
                console.log('🔊 모바일 음소거 해제 시도');
              }
            } catch (unmuteError) {
              console.warn('⚠️ 모바일 음소거 해제 실패 (나중에 자동으로 해제됨):', unmuteError);
            }
          }, 2000); // 모바일은 2초 후 음소거 해제 시도
          
        } catch (error) {
          console.warn('⚠️ 모바일 자동 재생 실패:', error);
          // 즉시 실패로 판단하지 않고 잠시 후 다시 확인
          setTimeout(() => {
            if (!isPlaying) {
              setAutoplayFailed(true);
              console.log('❌ 모바일 자동재생 최종 실패');
            }
          }, 2000);
        }
      }, 1000); // 1초 지연
    } else {
      // 데스크톱: 기존 방식
      console.log('🖥️ 데스크톱 환경 - 일반 자동재생 시도');
      try {
        // 음소거 상태에서 먼저 재생 시작 (브라우저 정책 우회)
        event.target.playVideo();
        console.log('🖥️ 데스크톱 자동 재생 시작 (음소거 상태)');
        
        // 재생이 시작되면 잠시 후 음소거 해제 시도
        setTimeout(() => {
          try {
            if (event.target.isMuted()) {
              event.target.unMute();
              console.log('🔊 데스크톱 음소거 해제 시도');
            }
          } catch (unmuteError) {
            console.warn('⚠️ 음소거 해제 실패 (나중에 자동으로 해제됨):', unmuteError);
          }
        }, 1000); // 1초 후 음소거 해제 시도
        
      } catch (error) {
        console.warn('⚠️ 데스크톱 자동 재생 실패:', error);
        // 즉시 실패로 판단하지 않고 잠시 후 다시 확인
        setTimeout(() => {
          if (!isPlaying) {
            setAutoplayFailed(true);
            console.log('❌ 데스크톱 자동재생 최종 실패');
          }
        }, 2000);
      }
    }
    
    // 새 영상이 준비되면 카운터를 1초부터 시작
    setWatchSeconds(1);
    // 전환 메시지 해제
    setIsTransitioning(false);
  };
  
  const handleYoutubeStateChange = (event) => {
    const state = event.data;
    console.log('🎮 YouTube 상태 변경:', state, {
      브라우저: navigator.userAgent,
      현재시간: new Date().toLocaleTimeString(),
      영상ID: selectedVideoId
    });
    
    // YouTube 플레이어 상태:
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    
    if (state === 1) {
      // 재생 중
      setIsPlaying(true);
      setAutoplayFailed(false); // 재생 성공 시 실패 상태 해제
      
      // 재생이 시작되면 음소거를 자동으로 해제
      if (playerRef.current && playerRef.current.isMuted()) {
        try {
          playerRef.current.unMute();
          console.log('🔊 재생 시작과 함께 음소거 자동 해제');
        } catch (error) {
          console.warn('⚠️ 음소거 해제 실패:', error);
        }
      }
      
      console.log('▶️ 영상 재생 시작 - autoplayFailed 해제');
    } else if (state === 2) {
      // 일시정지
      setIsPlaying(false);
      console.log('⏸️ 영상 일시정지');
    } else if (state === 0) {
      // 재생 종료
      setIsPlaying(false);
      console.log('⏹️ 영상 재생 종료');
    } else if (state === 3) {
      // 버퍼링 중
      console.log('🔄 영상 버퍼링 중');
    } else if (state === 5) {
      // 영상 준비됨 (재생 대기)
      console.log('📺 영상 준비됨');
      // 준비된 상태에서 자동 재생 시도 (지연 추가)
      setTimeout(() => {
        try {
          if (playerRef.current) {
            playerRef.current.playVideo();
            console.log('🔄 상태5에서 재생 시도');
          }
        } catch (error) {
          console.warn('⚠️ 상태5에서 자동 재생 시도 실패:', error);
          setAutoplayFailed(true);
        }
      }, 500); // 0.5초 지연
    } else if (state === -1) {
      // 시작되지 않음 - 자동재생이 차단된 상태일 가능성
      console.log('⚠️ 영상이 시작되지 않음 (자동재생 차단 가능성)');
      // 너무 성급하게 실패로 판단하지 않도록 조건을 더 엄격하게 설정
      setTimeout(() => {
        // 5초 후에도 재생이 시작되지 않고, 플레이어 상태가 여전히 -1이면 실패로 간주
        if (!isPlaying && playerRef.current && playerRef.current.getPlayerState() === -1) {
          setAutoplayFailed(true);
          console.log('❌ 자동재생 실패로 판단 (5초 후에도 상태 -1)');
        } else {
          console.log('✅ 자동재생 정상 작동 중 (상태 변경됨)');
        }
      }, 5000); // 3초 → 5초로 변경
    }
  };

  const handleYoutubeEnd = async () => {
    console.log('🎬 영상 종료 감지');
    setIsPlaying(false);

    // 시청 시간 저장 (토큰 적립)
    flushWatchTime();

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
        console.log('✅ 시청 완료 처리 완료');
      } catch (e) {
        console.error('❌ watchCount 업데이트 실패', e);
      }
    }

    // 자동 다음 영상 이동 로직 (지연 시간 증가)
    setTimeout(() => {
      if (videoList && videoList.length > 0) {
        const nextIdx = currentIndex + 1;
        // 다음 영상이 있으면 재생, 없으면 플레이어 종료
        if (nextIdx < videoList.length) {
          console.log('🎬 영상 종료 → 다음 영상으로 이동', { nextIdx, totalVideos: videoList.length });
          initializePlayer(currentRoomId || 'home', videoList, nextIdx);
        } else {
          console.log('🏁 마지막 영상 시청 완료 → 플레이어 종료');
          handleVideoSelect(null);
          resetPlayerState();
          setIsTransitioning(false);
        }
      } else {
        // 리스트가 없으면 단일 영상이었으므로 종료
        console.log('📺 단일 영상 시청 완료 → 플레이어 종료');
        handleVideoSelect(null);
        resetPlayerState();
        setIsTransitioning(false);
      }
    }, 3000); // 3초 지연으로 변경 (기존 2초에서 증가)
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
    setAutoplayFailed(false); // 자동 재생 실패 상태도 초기화
  }, [selectedVideoId]); // 영상 ID만 의존성으로 설정

  // autoplayFailed 상태가 true가 되면 10초 후 자동으로 닫기
  useEffect(() => {
    if (autoplayFailed) {
      const timer = setTimeout(() => {
        setAutoplayFailed(false);
        console.log('🔄 자동재생 실패 팝업 자동 닫힘 (10초 후)');
      }, 10000); // 10초 후 자동 닫기
      
      return () => clearTimeout(timer);
    }
  }, [autoplayFailed]);

  // 플레이어 닫기 (시청 시간 저장)
  const handleClose = () => {
    console.log('🔄 플레이어 닫기');
    
    // 시청 시간 저장 (토큰 적립)
    flushWatchTime();
    
    handleVideoSelect(null);
    resetPlayerState();
  };

  // 유튜브로 이동 (VideoPlayer 내부 버튼 사용 예정이지만 fallback 유지)
  const openInYoutube = () => {
    if (selectedVideoId) {
      window.open(`https://www.youtube.com/watch?v=${selectedVideoId}`, '_blank');
    }
  };

  // 수동 재생 버튼 핸들러
  const handleManualPlay = () => {
    if (playerRef.current) {
      try {
        // 먼저 재생 시작
        playerRef.current.playVideo();
        // 그 다음 음소거 해제
        setTimeout(() => {
          try {
            if (playerRef.current.isMuted()) {
              playerRef.current.unMute();
              console.log('🔊 수동 재생 후 음소거 해제');
            }
          } catch (unmuteError) {
            console.warn('⚠️ 수동 재생 후 음소거 해제 실패:', unmuteError);
          }
        }, 500); // 0.5초 후 음소거 해제
        
        setAutoplayFailed(false);
        console.log('▶️ 수동 재생 시작');
      } catch (error) {
        console.error('❌ 수동 재생 실패:', error);
      }
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
              if (!hasDragged) {
                setMinimized(false);
              }
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!hasDragged) {
                setMinimized(false);
              }
            }}
            style={{ touchAction: 'manipulation' }}
          >
            <FaPlay className="text-white text-3xl" />
          </div>
          {/* 최대화 버튼 */}
          <button
            className="absolute -top-2 -left-2 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm flex items-center justify-center shadow-lg transition-all duration-200 z-10"
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
            title="최대화"
          >
            <FaExpand size={14} />
          </button>
          
          {/* 최소화 상태에서도 항상 보이는 닫기 버튼 */}
          <button
            className="absolute -top-2 -right-2 w-7 h-7 bg-gray-800 hover:bg-red-600 text-white rounded-full text-sm flex items-center justify-center shadow-lg transition-all duration-200 z-10"
            onClick={handleClose}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleClose();
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
                onClick={handleClose}
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
            
            {/* 자동 재생 실패 시 안내 */}
            {autoplayFailed && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 text-center max-w-sm mx-4 shadow-lg">
                  <div className="text-xl font-bold text-gray-800 mb-3">
                    🚫 자동 재생이 차단되었습니다
                  </div>
                  <div className="text-sm text-gray-600 mb-4 leading-relaxed">
                    브라우저 정책으로 인해 자동 재생이 차단되었습니다.<br/>
                    <strong>아래 버튼을 클릭</strong>하여 수동으로 재생해주세요.
                  </div>
                  
                  {/* 환경별 안내 메시지 */}
                  <div className="text-xs text-blue-600 mb-4 bg-blue-50 p-2 rounded">
                    {/Mobi|Android|iPad|iPhone|iPod/i.test(navigator.userAgent) ? (
                      <span>📱 모바일에서는 데이터 절약을 위해 자동재생이 제한될 수 있습니다.</span>
                    ) : (
                      <span>🖥️ 브라우저 설정에서 자동재생을 허용하면 다음부터 자동으로 재생됩니다.</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleManualPlay}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                      ▶️ 재생하기
                    </button>
                    <button
                      onClick={() => setAutoplayFailed(false)}
                      className="px-3 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm transition-colors"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                  {currentVideo.durationDisplay || '시간 미확인'}
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
      {tokenNotification && <TokenNotification tokenData={tokenNotification} />}
    </div>,
    document.body
  );
}

export default GlobalVideoPlayer; 