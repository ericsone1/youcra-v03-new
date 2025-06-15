import { useNavigate } from 'react-router-dom';

export const useHomeHandlers = ({
  searchQuery,
  filteredChatRooms,
  selectedVideoId,
  setSelectedVideoId,
  setWatchSeconds,
  setVideoEnded,
  setLiked,
  setLikeCount,
  setFanCertified,
  setIsPlaying,
  setVideoDuration,
  setVideoCompleted,
  setPlayerLoading,
  ucraVideos,
  videos,
  playerRef,
  videoDuration,
  watchSeconds,
  videoEnded,
  fanCertified,
  getFanCertificationStatus,
  saveFanCertificationStatus
}) => {
  const navigate = useNavigate();

  // 채팅방 클릭 시 이동
  const handleRoomClick = (roomId) => {
    navigate(`/chat/${roomId}/info`);
  };

  // 검색 실행 함수
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // 채팅방 검색 결과가 있으면 첫 번째 방으로 이동
      if (filteredChatRooms.length > 0) {
        navigate(`/chat/${filteredChatRooms[0].id}/info`);
      }
    }
  };

  // 검색창 엔터키 처리 - 채팅방 검색
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 영상 선택 핸들러
  const handleVideoSelect = (videoId) => {
    if (selectedVideoId === videoId) {
      setSelectedVideoId(null);
      setWatchSeconds(0);
      setVideoEnded(false);
      setLiked(false);
      setLikeCount(0);
      setFanCertified(false);
      setIsPlaying(false);
      setVideoDuration(0);
      setVideoCompleted(false);
      setPlayerLoading(false);
    } else {
      setSelectedVideoId(videoId);
      setWatchSeconds(0);
      setVideoEnded(false);
      setLiked(false);
      // 시청인증 상태는 localStorage에서 불러오기
      const isCertified = getFanCertificationStatus ? getFanCertificationStatus(videoId) : false;
      setFanCertified(isCertified);
      setIsPlaying(false);
      setVideoDuration(0);
      setVideoCompleted(false);
      setPlayerLoading(true);
      // 좋아요 수 설정
      const ucraVideo = ucraVideos.find(v => v.videoId === videoId);
      const youtubeVideo = videos.find(v => v.id === videoId);
      if (ucraVideo) {
        setLikeCount(ucraVideo.ucraLikes || Math.floor(Math.random() * 1000) + 100);
      } else if (youtubeVideo) {
        setLikeCount(Number(youtubeVideo.statistics.likeCount || 0));
      } else {
        setLikeCount(Math.floor(Math.random() * 1000) + 100);
      }
    }
  };

  // YouTube 핸들러 (playerRef만 관리)
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    setVideoDuration(event.target.getDuration());
    setPlayerLoading(false);
  };

  const handleYoutubeStateChange = (event) => {
    if (event.data === 1) {
      // 재생 중
      setIsPlaying(true);
    } else if (event.data === 0) {
      // 종료
      setVideoCompleted(true);
      setVideoEnded(true);
      setIsPlaying(false);
    } else {
      // 일시정지 등
      setIsPlaying(false);
    }
  };

  const handleYoutubeEnd = () => {
    setVideoCompleted(true);
    setVideoEnded(true);
    setIsPlaying(false);
    if (playerRef.current?._watchTimer) {
      clearInterval(playerRef.current._watchTimer);
      playerRef.current._watchTimer = null;
    }
    
    // 다음 영상 자동 재생
    setTimeout(() => {
      const allVideos = [...ucraVideos, ...videos];
      const currentIndex = allVideos.findIndex(v => 
        (v.videoId || v.id) === selectedVideoId
      );
      
      if (currentIndex !== -1 && currentIndex < allVideos.length - 1) {
        const nextVideo = allVideos[currentIndex + 1];
        const nextVideoId = nextVideo.videoId || nextVideo.id;
        handleVideoSelect(nextVideoId);
      }
    }, 2000); // 2초 후 다음 영상 재생
  };

  // 팬 인증 핸들러
  const handleFanCertification = () => {
    const canCertify = videoDuration > 0 
      ? (videoDuration >= 180 ? watchSeconds >= 180 : videoEnded)
      : watchSeconds >= 180;
      
    if (canCertify && !fanCertified) {
      setFanCertified(true);
      if (saveFanCertificationStatus) {
        saveFanCertificationStatus(selectedVideoId, true);
      }
      alert('🎉 유튜버에게 당신의 시청인증 달성이 전달되었습니다!');
    }
  };

  return {
    handleRoomClick,
    handleSearch,
    handleSearchKeyDown,
    handleVideoSelect,
    handleYoutubeReady,
    handleYoutubeStateChange,
    handleYoutubeEnd,
    handleFanCertification
  };
}; 