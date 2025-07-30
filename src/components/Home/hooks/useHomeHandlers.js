import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

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
  fanCertified
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // 검색 핸들러
  const handleSearchChange = (searchQuery, setSearchQuery) => (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = (searchQuery, chatRooms) => () => {
    const filteredChatRooms = chatRooms.filter(
      (room) =>
        room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase().replace('#', '')))
    );
    
    if (searchQuery.trim() && filteredChatRooms.length > 0) {
      navigate(`/chat/${filteredChatRooms[0].id}`);
    }
  };

  const handleSearchKeyDown = (searchQuery, chatRooms) => (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery, chatRooms)();
    }
  };

  // 채팅방 클릭 핸들러
  const handleRoomClick = (roomId) => {
    // 로그인하지 않은 상태에서는 로그인 페이지로 이동
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // 채팅방 프로필로 이동
    navigate(`/chat/${roomId}/profile`);
  };

  const handleCreateRoomClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/chat/create');
  };

  const handleHashtagClick = (hashtag) => {
    console.log('해시태그 클릭:', hashtag);
    // 향후 해시태그 필터링 기능 구현 예정
  };

  const handleLikeToggle = async (roomId, currentLiked) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    console.log('좋아요 토글:', { roomId, currentLiked });
    // 좋아요 기능은 채팅방 내부에서 처리됨
  };

  const handleVideoPlay = (videoUrl) => {
    console.log('영상 재생:', videoUrl);
    // 영상 재생 로직
  };

  const handleShare = (roomId) => {
    const shareUrl = `${window.location.origin}/chat/${roomId}`;
    
    if (navigator.share) {
      navigator.share({
        title: '유크라 채팅방',
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('링크가 클립보드에 복사되었습니다!'))
        .catch(console.error);
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
      // 시청인증 상태 초기화 (새로운 WatchedVideosContext에서 관리)
      setFanCertified(false);
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
    
    // 환경별 자동재생 및 음소거 해제 시도
    const isMobile = /Mobi|Android|iPad|iPhone|iPod/i.test(navigator.userAgent);
    
    console.log('🎬 [useHomeHandlers] YouTube 플레이어 준비 완료');
    
    try {
      // 음소거 상태에서 재생 시작
      event.target.playVideo();
      console.log('🎬 [useHomeHandlers] 자동 재생 시도');
      
      // 환경별 음소거 해제 시도
      const unmuteDelay = isMobile ? 2000 : 1000;
      setTimeout(() => {
        try {
          if (event.target.isMuted()) {
            event.target.unMute();
            console.log('🔊 [useHomeHandlers] 음소거 해제 시도');
          }
        } catch (unmuteError) {
          console.warn('⚠️ [useHomeHandlers] 음소거 해제 실패:', unmuteError);
        }
      }, unmuteDelay);
      
    } catch (error) {
      console.warn('⚠️ [useHomeHandlers] 자동 재생 실패:', error);
    }
  };

  const handleYoutubeStateChange = (event) => {
    const state = event.data;
    
    if (state === 1) {
      // 재생 중
      setIsPlaying(true);
      
      // 재생이 시작되면 음소거를 자동으로 해제
      if (playerRef.current && playerRef.current.isMuted()) {
        try {
          playerRef.current.unMute();
          console.log('🔊 [useHomeHandlers] 재생 시작과 함께 음소거 자동 해제');
        } catch (error) {
          console.warn('⚠️ [useHomeHandlers] 음소거 해제 실패:', error);
        }
      }
      
    } else if (state === 0) {
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
    
    // 영상이 끝났을 때 시청 인증 조건을 충족했다면 자동 인증 처리
    const canCertify = videoDuration > 0
      ? (videoDuration >= 180 ? watchSeconds >= 180 : true) // 영상이 끝났으므로 조건 충족
      : watchSeconds >= 180;

    if (canCertify && !fanCertified) {
      setFanCertified(true);
      console.log('🎉 영상 종료로 인한 자동 시청 인증 완료! (새로운 시스템에서 처리)');
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

    // 1) 아직 인증 전이고 조건을 충족한 경우 → 인증 처리
    if (canCertify && !fanCertified) {
      setFanCertified(true);
      alert('🎉 시청 인증이 완료되었습니다! (새로운 시스템에서 처리)');
      return; // 여기서 종료(다음 영상은 두 번째 클릭에서 처리)
    }

    // 2) 이미 인증이 완료된 상태에서 버튼을 누르면 다음 영상으로 이동
    if (fanCertified) {
      const allVideos = [...ucraVideos, ...videos];
      const currentIndex = allVideos.findIndex((v) => (v.videoId || v.id) === selectedVideoId);

      if (currentIndex !== -1 && currentIndex < allVideos.length - 1) {
        const nextVideo = allVideos[currentIndex + 1];
        const nextVideoId = nextVideo.videoId || nextVideo.id;
        handleVideoSelect(nextVideoId);
      } else {
        alert('마지막 영상입니다.');
      }
    }
  };

  return {
    handleSearchChange,
    handleSearch,
    handleSearchKeyDown,
    handleRoomClick,
    handleCreateRoomClick,
    handleHashtagClick,
    handleLikeToggle,
    handleVideoPlay,
    handleShare,
    handleVideoSelect,
    handleYoutubeReady,
    handleYoutubeStateChange,
    handleYoutubeEnd,
    handleFanCertification
  };
}; 