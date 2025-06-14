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
} from "firebase/firestore";

const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

function Home() {
  console.log("🔥 완전한 홈탭이 실행되었습니다!");
  
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [fanCertified, setFanCertified] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5);
  const playerRef = useRef(null);
  const navigate = useNavigate();

  // 채팅방 상태
  const [chatRooms, setChatRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [visibleRoomsCount, setVisibleRoomsCount] = useState(3);

  // 앱 내 등록된 영상들 가져오기
  useEffect(() => {
    async function fetchRegisteredVideos() {
      setLoading(true);
      setError("");
      try {
        const roomsQuery = query(collection(db, "chatRooms"));
        const roomsSnapshot = await getDocs(roomsQuery);
        
        let allVideos = [];
        for (const roomDoc of roomsSnapshot.docs) {
          const roomData = roomDoc.data();
          const videosQuery = query(
            collection(db, "chatRooms", roomDoc.id, "videos"),
            orderBy("registeredAt", "desc")
          );
          const videosSnapshot = await getDocs(videosQuery);
          
          videosSnapshot.docs.forEach(videoDoc => {
            const videoData = videoDoc.data();
            if (videoData.videoId) {
              // YouTube API 형식으로 변환
              const convertedVideo = {
                id: videoData.videoId,
                snippet: {
                  title: videoData.title || "제목 없음",
                  channelTitle: videoData.channel || "채널 없음",
                  thumbnails: {
                    medium: {
                      url: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.videoId}/mqdefault.jpg`
                    }
                  }
                },
                statistics: {
                  viewCount: Math.floor(Math.random() * 50000) + 1000, // 더미 조회수
                  likeCount: Math.floor(Math.random() * 2000) + 50      // 더미 좋아요
                },
                contentDetails: {
                  duration: `PT${Math.floor(videoData.duration / 60)}M${videoData.duration % 60}S` || "PT3M30S"
                },
                // 추가 정보
                roomId: roomDoc.id,
                roomName: roomData.name || "채팅방",
                registeredAt: videoData.registeredAt,
                watchCount: Math.floor(Math.random() * 100) + 10, // 더미 시청 횟수
                certificationCount: Math.floor(Math.random() * 30) + 1 // 더미 인증 횟수
              };
              allVideos.push(convertedVideo);
            }
          });
        }
        
        // 시청 횟수 + 인증 횟수로 정렬 (실시간 인기순)
        allVideos.sort((a, b) => {
          const scoreA = (a.watchCount || 0) + (a.certificationCount || 0) * 2;
          const scoreB = (b.watchCount || 0) + (b.certificationCount || 0) * 2;
          return scoreB - scoreA;
        });
        
        setVideos(allVideos.slice(0, 20)); // 상위 20개만 표시
      } catch (err) {
        console.error("등록된 영상 가져오기 오류:", err);
        setError("등록된 영상을 불러올 수 없습니다: " + err.message);
      }
      setLoading(false);
    }
    fetchRegisteredVideos();
  }, []);

  // 인기 채팅방 데이터 가져오기
  useEffect(() => {
    const q = query(collection(db, "chatRooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoadingRooms(true);
      const roomPromises = snapshot.docs.slice(0, 10).map(async (docSnap) => {
        const room = { id: docSnap.id, ...docSnap.data() };
        
        // 기본 해시태그 설정
        if (!room.hashtags || room.hashtags.length === 0) {
          const dummyHashtags = [
            ["게임", "롤", "팀원모집"], ["음악", "힙합", "수다"], ["먹방", "맛집", "일상"],
            ["영화", "드라마", "토론"], ["스포츠", "축구", "응원"], ["공부", "취업", "정보공유"],
            ["여행", "맛집", "추천"], ["애니", "웹툰", "덕후"], ["연애", "고민", "상담"]
          ];
          room.hashtags = dummyHashtags[Math.floor(Math.random() * dummyHashtags.length)];
        }

        room.participantCount = Math.floor(Math.random() * 50) + 5;
        room.likesCount = Math.floor(Math.random() * 30) + 1;
        room.isActive = Math.random() > 0.3;
        return room;
      });

      const processedRooms = await Promise.all(roomPromises);
      setChatRooms(processedRooms);
      setLoadingRooms(false);
    });

    return () => unsubscribe();
  }, []);

  // 영상 선택 시 상태 초기화
  const handleVideoSelect = (videoId) => {
    if (videoId === selectedVideoId) {
      setSelectedVideoId(null);
      setWatchSeconds(0);
      setVideoEnded(false);
      setFanCertified(false);
      setLiked(false);
      setLikeCount(0);
      setVideoDuration(0);
      if (playerRef.current?._timer) {
        clearInterval(playerRef.current._timer);
        playerRef.current._timer = null;
      }
    } else {
      setSelectedVideoId(videoId);
      setWatchSeconds(0);
      setVideoEnded(false);
      setFanCertified(false);
      setLiked(false);
      setVideoDuration(0);
      const video = videos.find(v => v.id === videoId);
      setLikeCount(video ? Number(video.statistics.likeCount || 0) : 0);
      if (playerRef.current?._timer) {
        clearInterval(playerRef.current._timer);
        playerRef.current._timer = null;
      }
    }
  };

  // ISO 8601 -> 초 변환
  function parseDuration(iso) {
    if (!iso) return 0;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const [, h, m, s] = match.map(Number);
    return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
  }

  // YouTube 플레이어 핸들러
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    const video = videos.find(v => v.id === selectedVideoId);
    if (video) {
      const duration = parseDuration(video.contentDetails?.duration);
      setVideoDuration(duration);
    }
    setWatchSeconds(0);
    setVideoEnded(false);
    if (playerRef.current?._timer) {
      clearInterval(playerRef.current._timer);
      playerRef.current._timer = null;
    }
  };

  const handleYoutubeStateChange = (event) => {
    if (playerRef.current?._timer) {
      clearInterval(playerRef.current._timer);
      playerRef.current._timer = null;
    }
    if (event.data === 1) {
      playerRef.current._timer = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          setWatchSeconds(Math.floor(playerRef.current.getCurrentTime()));
        }
      }, 1000);
    }
    if (event.data === 0) {
      setVideoEnded(true);
      if (playerRef.current?._timer) {
        clearInterval(playerRef.current._timer);
        playerRef.current._timer = null;
      }
    }
  };

  const handleYoutubeEnd = () => {
    setVideoEnded(true);
    if (playerRef.current?._timer) {
      clearInterval(playerRef.current._timer);
      playerRef.current._timer = null;
    }
  };

  // 인증 버튼 활성화 조건
  const canCertify = videoDuration >= 180 ? watchSeconds >= 180 : videoEnded;

  // 인증 버튼 클릭
  const handleFanCertification = () => {
    if (canCertify && !fanCertified) {
      setFanCertified(true);
      alert('🎉 시청인증이 완료되었습니다!');
    }
  };

  // 필터링된 데이터
  const filteredVideos = videos.filter(
    (video) =>
      video.snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.snippet.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChatRooms = chatRooms.filter(
    (room) =>
      room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase().replace('#', '')))
  );

  // 채팅방 클릭 시 이동
  const handleRoomClick = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  // 검색 실행 함수
  const handleSearch = () => {
    if (searchQuery.trim() && filteredChatRooms.length > 0) {
      navigate(`/chat/${filteredChatRooms[0].id}`);
    }
  };

  // 검색창 엔터키 처리
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (playerRef.current?._timer) {
        clearInterval(playerRef.current._timer);
        playerRef.current._timer = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="spinner"></div>
          <div className="text-gray-600 font-medium">로딩 중...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">오류 발생</h3>
          <p className="text-red-600 mb-6">{error}</p>
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
        {/* 헤더 섹션 */}
        <div className="text-center py-4 relative">
          <div className="flex items-center justify-center mb-2">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-1">UCRA</h1>
              <p className="text-gray-600 text-sm">유튜브 크리에이터들의 공간</p>
            </div>
          </div>
        </div>

        {/* 실시간 인기 채팅방 순위 박스 */}
        <motion.div 
          className="card card-hover p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center mb-3 justify-center">
            <h2 className="text-xl font-bold text-center flex items-center justify-center">
              <span className="mr-2">🔥</span>
              실시간 인기 채팅방
            </h2>
          </div>
          
          {/* 검색창 */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="채팅방 이름, 키워드, #해시태그 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full p-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
            />
            <button 
              onClick={handleSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-blue-600 transition-colors duration-200 p-1"
              aria-label="검색"
            >
              <svg className="w-5 h-5 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          
          {/* 인기 채팅방 순위 리스트 */}
          {loadingRooms ? (
            <div className="text-center py-8">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-500">채팅방 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {(searchQuery ? filteredChatRooms : chatRooms).slice(0, visibleRoomsCount).map((room, idx) => (
                <motion.button
                  key={room.id}
                  className="w-full flex items-center gap-3 hover:bg-blue-50 rounded-lg px-3 py-2 transition-all duration-200 text-left"
                  onClick={() => handleRoomClick(room.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center min-w-[50px]">
                    <span className={`
                      font-bold text-xs w-8 h-6 rounded-full flex items-center justify-center text-white shadow-md
                      ${idx === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
                        idx === 1 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 
                        idx === 2 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 
                        'bg-gradient-to-r from-gray-400 to-gray-500'}
                    `}>
                      {idx + 1}위
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 truncate max-w-[160px]">
                      {room.name && room.name.length > 13 ? `${room.name.substring(0, 13)}...` : room.name}
                    </div>
                    {room.hashtags && room.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {room.hashtags.slice(0, 3).map((tag, tagIdx) => (
                          <span key={tagIdx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            #{tag}
                          </span>
                        ))}
                        {room.hashtags.length > 3 && (
                          <span className="text-xs text-gray-400">+{room.hashtags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end text-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center text-blue-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                        <span className="font-semibold">{room.participantCount}명</span>
                      </div>
                      <div className="flex items-center text-red-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="font-semibold">{room.likesCount || 0}</span>
                      </div>
                    </div>
                    {room.isActive && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </div>
                </motion.button>
              ))}
              
              {/* 더보기/접기 버튼 */}
              {!searchQuery && chatRooms.length > visibleRoomsCount && visibleRoomsCount < 10 && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setVisibleRoomsCount(10)}
                    className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full font-bold hover:bg-blue-200 transition-all duration-200"
                  >
                    더보기
                  </button>
                </div>
              )}
              {!searchQuery && visibleRoomsCount > 3 && (
                <div className="text-center mt-2">
                  <button
                    onClick={() => setVisibleRoomsCount(3)}
                    className="px-4 py-1 text-gray-500 hover:text-gray-700 text-sm transition-all duration-200"
                  >
                    접기 ↑
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* 실시간 시청순위 리스트 */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
            📺 실시간 UCRA 시청순위
          </h3>
          
          {filteredVideos.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">등록된 영상이 없습니다</h3>
              <p className="text-gray-600 mb-4">채팅방에서 첫 번째 영상을 등록해보세요!</p>
              <button 
                onClick={() => navigate('/chat')}
                className="btn-primary px-6 py-2"
              >
                채팅방 둘러보기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVideos.slice(0, visibleCount).map((video, idx) => {
              const viewCount = Number(video.statistics.viewCount).toLocaleString();
              const likeCountDisplay = Number(video.statistics.likeCount || 0).toLocaleString();
              const watching = Math.floor(Math.random() * 1000) + 100;
              const rankChange = idx < 3 ? Math.floor(Math.random() * 3) + 1 : 0;
              
              return (
                <motion.div
                  key={video.id}
                  className="card card-hover p-2.5 cursor-pointer"
                  onClick={() => handleVideoSelect(video.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex gap-2.5 items-start">
                    {/* 순위 배지 */}
                    <div className="flex flex-col items-center min-w-[35px] mt-1">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md
                        ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 
                          idx === 1 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 
                          idx === 2 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 
                          'bg-gradient-to-br from-gray-400 to-gray-500'}
                      `}>
                        {idx + 1}
                      </div>
                      {idx < 3 && (
                        <span className="text-green-500 text-xs font-medium mt-0.5 flex items-center">
                          <svg className="w-2 h-2 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          {rankChange}
                        </span>
                      )}
                    </div>
                    
                    {/* 썸네일 */}
                    <div className="relative">
                      <img
                        src={video.snippet.thumbnails.medium.url}
                        alt={video.snippet.title}
                        className="w-32 h-18 object-cover rounded-lg shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1 leading-tight text-sm">
                        {video.snippet.title}
                      </h4>
                      <p className="text-xs text-gray-500 mb-1.5 truncate font-medium">{video.snippet.channelTitle}</p>
                      
                      {/* 채팅방 정보 */}
                      {video.roomName && (
                        <div className="flex items-center text-purple-600 mb-1 text-xs">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">{video.roomName}</span>
                        </div>
                      )}
                      
                      {/* 통계 */}
                      <div className="flex items-center gap-2.5 text-xs">
                        <div className="flex items-center text-red-500">
                          <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">{likeCountDisplay}</span>
                        </div>
                        <div className="flex items-center text-blue-500">
                          <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">{video.watchCount || watching}명</span>
                        </div>
                        <div className="flex items-center text-green-500">
                          <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-semibold">{video.certificationCount}인증</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* YouTube 플레이어 */}
                  <AnimatePresence>
                    {selectedVideoId === video.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3"
                      >
                        <div className="rounded-lg shadow-lg">
                          <YouTube
                            key={video.id}
                            videoId={video.id}
                            onReady={handleYoutubeReady}
                            onStateChange={handleYoutubeStateChange}
                            onEnd={handleYoutubeEnd}
                            opts={{
                              width: "100%",
                              height: "200",
                              playerVars: {
                                autoplay: 1,
                                controls: 1,
                                modestbranding: 1,
                                rel: 0,
                              },
                            }}
                          />
                        </div>
                        
                        <div className="mt-2 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600 font-medium">
                              시청 시간: {Math.floor(watchSeconds / 60)}:{(watchSeconds % 60).toString().padStart(2, '0')}
                            </span>
                            <span className="text-gray-500">
                              전체: {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          {/* 진행률 바 */}
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${Math.min((watchSeconds / videoDuration) * 100, 100)}%` }}
                            />
                          </div>
                          {/* 안내 문구 */}
                          <div className="text-xs text-gray-500 text-center">
                            {videoDuration >= 180
                              ? `3분 이상 시청 시 인증 가능`
                              : `영상 끝까지 시청 시 인증 가능`}
                          </div>
                          {/* 버튼들 */}
                          <div className="flex flex-col gap-2 mt-2">
                            {/* 첫 번째 줄: 좋아요, 인증 버튼 */}
                            <div className="flex gap-2">
                              {/* 좋아요 버튼 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLiked(l => !l);
                                }}
                                className={`flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-full font-semibold transition-all duration-200 ${liked ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'}`}
                              >
                                <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span className="font-semibold">{(likeCount + (liked ? 1 : 0)).toLocaleString()}</span>
                              </button>
                              {/* 인증 버튼 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFanCertification();
                                }}
                                disabled={!canCertify || fanCertified}
                                className={`flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-full font-semibold transition-all duration-200 ${fanCertified ? 'bg-green-500 text-white' : canCertify ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                              >
                                {fanCertified ? (
                                  <>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-semibold">인증완료</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="font-semibold">시청인증</span>
                                  </>
                                )}
                              </button>
                            </div>
                            {/* 두 번째 줄: 구독/좋아요, 채팅방 이동 버튼 */}
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
                                }}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-all duration-200 hover:scale-105 text-sm"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                                <span>유튜브</span>
                              </button>
                              {video.roomId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/chat/${video.roomId}`);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-600 transition-all duration-200 hover:scale-105 text-sm"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                  </svg>
                                  <span>채팅방</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            
            {/* 더보기 버튼 */}
            {visibleCount < filteredVideos.length && (
              <motion.div 
                className="text-center pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <button
                  onClick={() => setVisibleCount(prev => prev + 5)}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  더 많은 영상 보기 ({filteredVideos.length - visibleCount}개 남음)
                </button>
              </motion.div>
            )}
          </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Home; 