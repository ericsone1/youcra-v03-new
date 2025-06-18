import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVideos } from "./hooks/useVideos";
import { useChatRooms } from "./hooks/useChatRooms";
import { parseDuration } from "./utils/videoUtils";
import { motion, AnimatePresence } from "framer-motion";
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

  // 시청인증 완료 모달 상태
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [certificationVideoTitle, setCertificationVideoTitle] = useState("");

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
      // 영상 종료 시 자동 인증 처리
      handleAutoWatchCompletion();
    }
  };

  const handleYoutubeEnd = () => {
    setVideoEnded(true);
    resetPlayerTimer();
    // 영상 종료 시 자동 인증 처리
    handleAutoWatchCompletion();
  };

  // 자동 시청 완료 처리 함수
  const handleAutoWatchCompletion = () => {
    // 인증 조건 확인
    const canAutoVerify = (() => {
      if (videoDuration > 1800) {
        // 30분 초과 영상: 30분(1800초) 시청 후 인증 가능
        return watchSeconds >= 1800;
      } else {
        // 30분 이하 영상: 끝까지 시청 후 인증 가능 (영상이 끝났으므로 조건 충족)
        return true;
      }
    })();

    // 자동 인증 처리
    if (canAutoVerify && !fanCertified) {
      setFanCertified(true);
      
      // 현재 영상 제목 가져오기
      const currentVideo = videos.find(v => v.id === selectedVideoId);
      setCertificationVideoTitle(currentVideo?.snippet?.title || "영상");
      
      // 팝업 모달 표시 (0.5초 딜레이)
      setTimeout(() => {
        setShowCertificationModal(true);
      }, 500);
      
      console.log('✅ 자동 시청 인증 완료:', selectedVideoId);
    }
  };

  const resetPlayerTimer = () => {
    if (playerRef.current?._timer) {
      clearInterval(playerRef.current._timer);
      playerRef.current._timer = null;
    }
  };

  // 인증 조건 확인 - 30분 기준 조건
  const canCertify = (() => {
    if (videoDuration > 1800) {
      // 30분 초과 영상: 30분(1800초) 시청 후 인증 가능
      return watchSeconds >= 1800;
    } else {
      // 30분 이하 영상: 끝까지 시청 후 인증 가능
      return videoEnded;
    }
  })();

  // 인증 버튼 클릭 (수동 인증)
  const handleFanCertification = () => {
    if (canCertify && !fanCertified) {
      setFanCertified(true);
      
      // 현재 영상 제목 가져오기
      const currentVideo = videos.find(v => v.id === selectedVideoId);
      setCertificationVideoTitle(currentVideo?.snippet?.title || "영상");
      
      // 팝업 모달 표시
      setShowCertificationModal(true);
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

  // 시청인증 완료 모달 컴포넌트
  const CertificationModal = () => (
    <AnimatePresence>
      {showCertificationModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCertificationModal(false)}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </motion.div>
              <h2 className="text-xl font-bold">🎉 시청인증 완료!</h2>
            </div>
            
            {/* 내용 */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-700 font-medium mb-2">
                  영상 시청이 완료되었습니다!
                </p>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600 font-medium line-clamp-2">
                    "{certificationVideoTitle}"
                  </p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="text-blue-800 font-semibold text-sm">
                    📤 상대방에게 시청인증 결과가 전송되었습니다
                  </p>
                </div>
              </div>
              
              {/* 버튼 */}
              <button
                onClick={() => setShowCertificationModal(false)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105"
              >
                확인
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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

        {/* 개발용 관리자 버튼 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-100 border-2 border-red-300 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-red-800">🔧 개발자 도구</h3>
                <p className="text-sm text-red-600">게시판 더미 데이터 생성</p>
              </div>
              <button
                onClick={() => navigate('/admin')}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                관리자 페이지
              </button>
            </div>
          </div>
        )}

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
      <CertificationModal />
    </div>
  );
}

export default Home; 