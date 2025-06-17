import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVideos } from "./hooks/useVideos";
import { useChatRooms } from "./hooks/useChatRooms";
import { parseDuration } from "./utils/videoUtils";
import Header from "./Header";
import PopularChatRooms from "./PopularChatRooms";
import VideoRankingList from "./VideoRankingList";

function Home() {
  const navigate = useNavigate();
  const playerRef = useRef(null);
  
  // 커스텀 훅 사용
  const { videos, loading: videosLoading, error: videosError } = useVideos();
  const { chatRooms, loading: roomsLoading } = useChatRooms();
  
  // 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  
  // 비디오 플레이어 상태
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [fanCertified, setFanCertified] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 영상 선택 핸들러
  const handleVideoSelect = (videoId) => {
    if (videoId === selectedVideoId) {
      // 같은 영상 클릭 시 플레이어 닫기
      setSelectedVideoId(null);
      resetPlayerState();
    } else {
      // 새 영상 선택
      setSelectedVideoId(videoId);
      resetPlayerState();
      const video = videos.find(v => v.id === videoId);
      setLikeCount(video ? Number(video.statistics.likeCount || 0) : 0);
    }
  };

  // 플레이어 상태 초기화
  const resetPlayerState = () => {
    setWatchSeconds(0);
    setVideoEnded(false);
    setFanCertified(false);
    setLiked(false);
    setVideoDuration(0);
    if (playerRef.current?._timer) {
      clearInterval(playerRef.current._timer);
      playerRef.current._timer = null;
    }
  };

  // YouTube 플레이어 이벤트 핸들러
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    const video = videos.find(v => v.id === selectedVideoId);
    if (video) {
      const duration = parseDuration(video.contentDetails?.duration);
      setVideoDuration(duration);
    }
    setWatchSeconds(0);
    setVideoEnded(false);
    resetPlayerTimer();
  };

  const handleYoutubeStateChange = (event) => {
    resetPlayerTimer();
    if (event.data === 1) { // 재생 중
      playerRef.current._timer = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          setWatchSeconds(Math.floor(playerRef.current.getCurrentTime()));
        }
      }, 1000);
    }
    if (event.data === 0) { // 종료
      setVideoEnded(true);
      resetPlayerTimer();
    }
  };

  const handleYoutubeEnd = () => {
    setVideoEnded(true);
    resetPlayerTimer();
  };

  const resetPlayerTimer = () => {
    if (playerRef.current?._timer) {
      clearInterval(playerRef.current._timer);
      playerRef.current._timer = null;
    }
  };

  // 인증 조건 확인
  const canCertify = videoDuration >= 180 ? watchSeconds >= 180 : videoEnded;

  // 인증 버튼 클릭
  const handleFanCertification = () => {
    if (canCertify && !fanCertified) {
      setFanCertified(true);
      alert('🎉 시청인증이 완료되었습니다!');
    }
  };

  // 좋아요 토글
  const handleLikeToggle = () => {
    setLiked(prev => !prev);
  };

  // 검색 관련 핸들러
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    const filteredChatRooms = chatRooms.filter(
      (room) =>
        room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase().replace('#', '')))
    );
    
    if (searchQuery.trim() && filteredChatRooms.length > 0) {
      navigate(`/chat/${filteredChatRooms[0].id}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 채팅방 클릭
  const handleRoomClick = (roomId) => {
    navigate(`/chat/${roomId}/profile`);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      resetPlayerTimer();
    };
  }, []);

  // 로딩 상태
  if (videosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="spinner"></div>
          <div className="text-gray-600 font-medium">로딩 중...</div>
        </div>
      </div>
    );
  }
  
  // 에러 상태
  if (videosError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">오류 발생</h3>
          <p className="text-red-600 mb-6">{videosError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary w-full"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto hide-scrollbar">
      <div className="max-w-2xl mx-auto p-2 space-y-4">
        {/* 헤더 */}
        <Header />

        {/* 실시간 인기 채팅방 */}
        <PopularChatRooms
          chatRooms={chatRooms}
          loading={roomsLoading}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSearch={handleSearch}
          onSearchKeyDown={handleSearchKeyDown}
          onRoomClick={handleRoomClick}
        />

        {/* 실시간 시청순위 */}
        <VideoRankingList
          videos={videos}
          searchQuery={searchQuery}
          selectedVideoId={selectedVideoId}
          watchSeconds={watchSeconds}
          videoDuration={videoDuration}
          canCertify={canCertify}
          fanCertified={fanCertified}
          liked={liked}
          likeCount={likeCount}
          onVideoSelect={handleVideoSelect}
          onYoutubeReady={handleYoutubeReady}
          onYoutubeStateChange={handleYoutubeStateChange}
          onYoutubeEnd={handleYoutubeEnd}
          onLikeToggle={handleLikeToggle}
          onFanCertification={handleFanCertification}
        />
      </div>
    </div>
  );
}

export default Home; 