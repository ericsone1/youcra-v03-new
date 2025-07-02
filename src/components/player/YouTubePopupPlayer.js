import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const YouTubePopupPlayer = ({ 
  videoId, 
  isOpen, 
  onClose, 
  onWatchTimeUpdate, 
  onComplete,
  video 
}) => {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  // YouTube IFrame API 로드
  useEffect(() => {
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
      
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId, isOpen]);

  const initializePlayer = () => {
    if (!isOpen || !videoId || !playerRef.current) return;

    const newPlayer = new window.YT.Player(playerRef.current, {
      height: '360',
      width: '640',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        fs: 1,
        cc_load_policy: 1,
        iv_load_policy: 3,
        modestbranding: 1
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError
      }
    });

    setPlayer(newPlayer);
  };

  const onPlayerReady = (event) => {
    console.log('🎬 YouTube 플레이어 준비 완료');
    setDuration(event.target.getDuration());
    
    // 1초마다 재생 시간 업데이트
    intervalRef.current = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function') {
        const current = player.getCurrentTime();
        setCurrentTime(current);
        
        // 실제 시청 시간 누적 (재생 중일 때만)
        if (isPlaying) {
          setWatchTime(prev => {
            const newWatchTime = prev + 1;
            
            // 상위 컴포넌트에 시청 시간 전달
            if (onWatchTimeUpdate) {
              onWatchTimeUpdate(newWatchTime, current, duration);
            }
            
            // 70% 시청 완료 체크
            const watchPercentage = (newWatchTime / duration) * 100;
            if (watchPercentage >= 70 && onComplete) {
              onComplete({
                video,
                watchTimeSeconds: newWatchTime,
                watchPercentage: Math.round(watchPercentage),
                videoDuration: duration,
                completed: true
              });
            }
            
            return newWatchTime;
          });
        }
      }
    }, 1000);
  };

  const onPlayerStateChange = (event) => {
    const state = event.data;
    
    switch (state) {
      case window.YT.PlayerState.PLAYING:
        console.log('▶️ 재생 시작');
        setIsPlaying(true);
        break;
      case window.YT.PlayerState.PAUSED:
        console.log('⏸️ 재생 일시정지');
        setIsPlaying(false);
        break;
      case window.YT.PlayerState.ENDED:
        console.log('🏁 재생 완료');
        setIsPlaying(false);
        // 영상 완료 시 자동으로 완료 처리
        if (onComplete) {
          onComplete({
            video,
            watchTimeSeconds: watchTime,
            watchPercentage: Math.round((watchTime / duration) * 100),
            videoDuration: duration,
            completed: true
          });
        }
        break;
      case window.YT.PlayerState.BUFFERING:
        console.log('🔄 버퍼링 중');
        break;
    }
  };

  const onPlayerError = (event) => {
    console.error('YouTube 플레이어 오류:', event.data);
  };

  const handleClose = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // 시청 미완료 시에도 결과 전달
    if (onComplete && watchTime > 0) {
      const watchPercentage = (watchTime / duration) * 100;
      onComplete({
        video,
        watchTimeSeconds: watchTime,
        watchPercentage: Math.round(watchPercentage),
        videoDuration: duration,
        completed: watchPercentage >= 70
      });
    }
    
    onClose();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const watchPercentage = duration > 0 ? (watchTime / duration) * 100 : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: isMinimized ? 0.3 : 1, 
            opacity: 1,
            x: isMinimized ? '40vw' : 0,
            y: isMinimized ? '35vh' : 0
          }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className={`bg-white rounded-lg shadow-2xl ${
            isMinimized ? 'w-80 h-60' : 'w-auto h-auto'
          } max-w-4xl max-h-[90vh] overflow-hidden`}
        >
          {/* 제어 바 */}
          <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-medium truncate max-w-md">
                {video?.title || 'YouTube 영상'}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-1 rounded text-xs ${
                  isPlaying ? 'bg-green-500' : 'bg-gray-500'
                }`}>
                  {isPlaying ? '▶️ 재생중' : '⏸️ 정지'}
                </span>
                <span className="text-blue-300">
                  {formatTime(watchTime)} / {formatTime(duration)}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  watchPercentage >= 70 ? 'bg-green-500' : 'bg-yellow-500'
                }`}>
                  {watchPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMinimize}
                className="hover:bg-gray-700 p-1 rounded"
                title={isMinimized ? "확대" : "최소화"}
              >
                {isMinimized ? '🔍' : '📐'}
              </button>
              <button
                onClick={handleClose}
                className="hover:bg-red-600 p-1 rounded"
                title="닫기"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="bg-gray-200 h-1">
            <motion.div
              className={`h-1 ${
                watchPercentage >= 70 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(watchPercentage, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* YouTube 플레이어 */}
          {!isMinimized && (
            <div className="relative">
              <div ref={playerRef} className="w-full" />
              
              {/* 토큰 적립 알림 */}
              {watchPercentage >= 70 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg"
                >
                  🎉 토큰 적립 완료!
                </motion.div>
              )}
            </div>
          )}

          {/* 최소화 상태에서 간단 정보 */}
          {isMinimized && (
            <div className="p-4 text-center">
              <div className="text-sm text-gray-600 mb-2">시청 추적 중...</div>
              <div className="text-lg font-bold">
                {watchPercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                목표: 70% 이상
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default YouTubePopupPlayer; 