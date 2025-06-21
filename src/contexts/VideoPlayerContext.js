import React, { createContext, useContext, useState, useRef } from 'react';

const VideoPlayerContext = createContext();

export const useVideoPlayer = () => {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
};

export const VideoPlayerProvider = ({ children }) => {
  // 플레이어 상태
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(null);
  const [videoList, setVideoList] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 20, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [lastPlayerTime, setLastPlayerTime] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [endCountdown, setEndCountdown] = useState(0);
  const [certCompleteCountdown, setCertCompleteCountdown] = useState(0);
  const [watchSettings, setWatchSettings] = useState({
    enabled: true,
    watchMode: 'partial'
  });
  const [certifiedVideoIds, setCertifiedVideoIds] = useState([]);
  const [currentVideoCertCount, setCurrentVideoCertCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [watching, setWatching] = useState(Math.floor(Math.random() * 50) + 10);

  // Refs
  const playerRef = useRef(null);
  const autoNextTimer = useRef(null);
  const endTimer = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // 플레이어 초기화
  const initializePlayer = (newRoomId, newVideoList, initialVideoIdx = null) => {
    setRoomId(newRoomId);
    setVideoList(newVideoList);
    if (initialVideoIdx !== null) {
      setSelectedVideoIdx(initialVideoIdx);
    }
    // 기존 상태 초기화
    setWatchSeconds(0);
    setLastPlayerTime(0);
    setVideoEnded(false);
    setIsCertified(false);
    setCertLoading(false);
    setCountdown(0);
    setEndCountdown(0);
    setCertCompleteCountdown(0);
  };

  // 플레이어 닫기
  const closePlayer = () => {
    setSelectedVideoIdx(null);
    setMinimized(false);
    setRoomId(null);
    setVideoList([]);
    
    // 타이머 정리
    if (autoNextTimer.current) {
      clearInterval(autoNextTimer.current);
      autoNextTimer.current = null;
    }
    if (endTimer.current) {
      clearInterval(endTimer.current);
      endTimer.current = null;
    }
    if (playerRef.current && playerRef.current._interval) {
      clearInterval(playerRef.current._interval);
      playerRef.current._interval = null;
    }
  };

  // 비디오 목록 업데이트
  const updateVideoList = (newVideoList) => {
    setVideoList(newVideoList);
  };

  // 비디오 선택
  const selectVideo = (videoIdx) => {
    // 기존 타이머 정리
    if (endTimer.current) {
      clearInterval(endTimer.current);
      endTimer.current = null;
    }
    
    setSelectedVideoIdx(videoIdx);
    setWatchSeconds(0);
    setLastPlayerTime(0);
    setVideoEnded(false);
    setIsCertified(false);
    setCertLoading(false);
    setCountdown(0);
    setEndCountdown(0);
    setCertCompleteCountdown(0);
    setCurrentVideoCertCount(0);
    setLiked(false);
    setLikeCount(0);
    setWatching(Math.floor(Math.random() * 50) + 10); // 10-59 랜덤값
  };

  const value = {
    // 상태
    selectedVideoIdx,
    setSelectedVideoIdx,
    videoList,
    setVideoList,
    roomId,
    setRoomId,
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
    
    // Refs
    playerRef,
    autoNextTimer,
    endTimer,
    dragOffset,
    
    // 함수
    initializePlayer,
    closePlayer,
    updateVideoList,
    selectVideo
  };

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}; 