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
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoList, setVideoList] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  
  const playerRef = useRef(null);

  // 비디오 선택 시 상태 초기화
  const handleVideoSelect = (videoId) => {
    console.log('🎯 VideoPlayerContext - handleVideoSelect 호출됨:', { 
      videoId, 
      selectedVideoId, 
      currentState: {
        selectedVideoId,
        isPlaying,
        playerLoading,
        videoDuration
      }
    });
    
    // null이나 undefined인 경우 플레이어 닫기
    if (!videoId) {
      console.log('🔄 비디오 ID가 없음 - 플레이어 닫기');
      setSelectedVideoId(null);
      resetPlayerState();
      return;
    }
    
    if (selectedVideoId === videoId) {
      console.log('🔄 같은 영상 선택 - 플레이어 닫기');
      setSelectedVideoId(null);
      resetPlayerState();
    } else {
      console.log('🆕 새 영상 선택 - 플레이어 열기');
      console.log('📝 setSelectedVideoId 호출 전 현재 상태:', {
        selectedVideoId,
        isPlaying,
        playerLoading,
        videoDuration
      });
      
      // 모든 상태를 한 번에 업데이트
      setSelectedVideoId(videoId);
      setIsPlaying(false);
      setVideoDuration(0);
      setPlayerLoading(true);
      
      console.log('📝 모든 상태 업데이트 완료, 새 videoId:', videoId);
      
      // 상태 업데이트 확인을 위한 타이머
      setTimeout(() => {
        console.log('🕐 상태 업데이트 확인 (0.1초 후):', {
          selectedVideoId: videoId, // 예상값
          actualSelectedVideoId: selectedVideoId // 실제값은 다음 렌더링에서 확인됨
        });
      }, 100);
    }
    
    console.log('🎬 VideoPlayerContext 상태 업데이트 완료');
  };

  // 플레이어 상태 초기화
  const resetPlayerState = () => {
    setIsPlaying(false);
    setVideoDuration(0);
    setPlayerLoading(false);
  };

  // 영상 리스트 업데이트
  const updateVideoList = (videos) => {
    setVideoList(videos);
  };

  // 플레이어 초기화 및 영상 선택
  const initializePlayer = (roomId, videos, selectedIndex = 0) => {
    setCurrentRoomId(roomId);
    setVideoList(videos);
    if (videos && videos.length > 0 && selectedIndex >= 0 && selectedIndex < videos.length) {
      const selectedVideo = videos[selectedIndex];
      setSelectedVideoId(selectedVideo.id);
      resetPlayerState();
      setPlayerLoading(true);
    }
  };

  const value = {
    selectedVideoId,
    setSelectedVideoId,
    isPlaying,
    setIsPlaying,
    playerLoading,
    setPlayerLoading,
    videoDuration,
    setVideoDuration,
    videoList,
    currentRoomId,
    playerRef,
    handleVideoSelect,
    resetPlayerState,
    updateVideoList,
    initializePlayer
  };

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}; 