import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import { AnimatePresence, motion } from "framer-motion";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  limit,
  setDoc,
  deleteDoc,
  doc,
  getDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { API_KEY, CATEGORY_KEYWORDS } from "./Home/utils/constants";
import { useUserCategory } from "./Home/hooks/useUserCategory";
import { useUcraVideos } from "./Home/hooks/useUcraVideos";
import { useYouTubeVideos } from "./Home/hooks/useYouTubeVideos";
import { useYouTubePlayer } from "./Home/hooks/useYouTubePlayer";
import { useErrorSuppression } from "./Home/hooks/useErrorSuppression";
import { useChatRoomsData } from "./Home/hooks/useChatRoomsData";
import { computeUniqueVideos } from "./Home/utils/videoUtils";
import { useHomeHandlers } from "./Home/hooks/useHomeHandlers";
import { LoadingSpinner, ErrorDisplay } from "./Home/components/LoadingError";
import { HomeHeader } from "./Home/components/HomeHeader";
import { ChatRoomSection } from "./Home/components/ChatRoomSection";
import { VideoSection } from "./Home/components/VideoSection";

function Home() {
  const { currentUser } = useAuth();
  const { userCategory } = useUserCategory(currentUser);
  const { videos, loading, error } = useYouTubeVideos();
  const { ucraVideos, loadingUcraVideos } = useUcraVideos(userCategory);
  const { chatRooms, loadingRooms } = useChatRoomsData();
  const {
    selectedVideoId,
    setSelectedVideoId,
    watchSeconds,
    setWatchSeconds,
    isPlaying,
    setIsPlaying,
    watchTimer,
    setWatchTimer,
    liked,
    setLiked,
    likeCount,
    setLikeCount,
    videoDuration,
    setVideoDuration,
    videoCompleted,
    setVideoCompleted,
    fanCertified,
    setFanCertified,
    videoEnded,
    setVideoEnded,
    playerLoading,
    setPlayerLoading,
    playerRef,
    currentVideoRef
  } = useYouTubePlayer();
  
  useErrorSuppression();
  
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);
  const [roomLikes, setRoomLikes] = useState({}); // 좋아요 상태 관리
  const [visibleRoomsCount, setVisibleRoomsCount] = useState(3); // 표시할 채팅방 수

  // 시청인증 상태 관리 함수들
  const getFanCertificationStatus = (videoId) => {
    const saved = localStorage.getItem(`fanCertified_${videoId}`);
    return saved === 'true';
  };

  const saveFanCertificationStatus = (videoId, status) => {
    localStorage.setItem(`fanCertified_${videoId}`, status.toString());
  };

  const filteredVideos = videos.filter(
    (video) =>
      video.snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.snippet.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChatRooms = chatRooms.filter(
    (room) =>
      room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.lastMsg?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase().replace('#', '')))
  );

  // 이벤트 핸들러 훅 사용
  const {
    handleRoomClick,
    handleSearch,
    handleSearchKeyDown,
    handleVideoSelect,
    handleYoutubeReady,
    handleYoutubeStateChange,
    handleYoutubeEnd,
    handleFanCertification
  } = useHomeHandlers({
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
  });

  const uniqueVideos = computeUniqueVideos(ucraVideos);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div 
      className="min-h-screen overflow-y-auto hide-scrollbar pb-20"
    >

      <div className="max-w-2xl mx-auto p-2 space-y-4">
        <HomeHeader />

        <ChatRoomSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearchKeyDown={handleSearchKeyDown}
          handleSearch={handleSearch}
          loadingRooms={loadingRooms}
          chatRooms={chatRooms}
          filteredChatRooms={filteredChatRooms}
          visibleRoomsCount={visibleRoomsCount}
          setVisibleRoomsCount={setVisibleRoomsCount}
          handleRoomClick={handleRoomClick}
        />

        <VideoSection
          userCategory={userCategory}
          currentUser={currentUser}
          loadingUcraVideos={loadingUcraVideos}
          ucraVideos={ucraVideos}
          uniqueVideos={uniqueVideos}
          visibleCount={visibleCount}
          setVisibleCount={setVisibleCount}
          handleVideoSelect={handleVideoSelect}
          handleFanCertification={handleFanCertification}
          selectedVideoId={selectedVideoId}
          playerLoading={playerLoading}
          watchSeconds={watchSeconds}
          liked={liked}
          setLiked={setLiked}
          likeCount={likeCount}
          setLikeCount={setLikeCount}
          fanCertified={fanCertified}
          videoDuration={videoDuration}
          videoEnded={videoEnded}
          handleYoutubeReady={handleYoutubeReady}
          handleYoutubeStateChange={handleYoutubeStateChange}
          handleYoutubeEnd={handleYoutubeEnd}
          playerRef={playerRef}
        />
      </div>
    </div>
  );
}

export default Home;