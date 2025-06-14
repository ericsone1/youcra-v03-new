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
} from "firebase/firestore";

const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

function Home() {
  console.log("🔥 현재_백업/Home.js가 실행되었습니다!");
  
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

  // 채팅방 상태 추가
  const [chatRooms, setChatRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [visibleRoomsCount, setVisibleRoomsCount] = useState(3);

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&maxResults=20&regionCode=KR&key=${API_KEY}`
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        setVideos(data.items || []);
      } catch (err) {
        setError("유튜브 API 오류: " + err.message);
      }
      setLoading(false);
    }
    fetchVideos();
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
            ["영화", "드라마", "토론"], ["스포츠", "축구", "응원"], ["공부", "취업", "정보공유"]
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
    // 영상 길이 가져오기
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
    // 기존 타이머 정리
    if (playerRef.current?._timer) {
      clearInterval(playerRef.current._timer);
      playerRef.current._timer = null;
    }
    // 재생 중일 때만 타이머 생성
    if (event.data === 1) {
      playerRef.current._timer = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          setWatchSeconds(Math.floor(playerRef.current.getCurrentTime()));
        }
      }, 1000);
    }
    // 영상 종료
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

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

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
      <ul>
        {videos.map((video) => (
          <li
            key={video.id}
            className="flex flex-col gap-2 mb-6 bg-white rounded-lg shadow hover:bg-blue-50 transition"
          >
            <div className="flex gap-4 items-center p-3 cursor-pointer" onClick={() => handleVideoSelect(video.id)}>
              <img
                src={video.snippet.thumbnails.medium.url}
                alt={video.snippet.title}
                className="w-28 h-16 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{video.snippet.title}</div>
                <div className="text-xs text-gray-500">{video.snippet.channelTitle}</div>
                <div className="text-xs text-gray-400">
                  조회수 {Number(video.statistics.viewCount).toLocaleString()} · 좋아요 {Number(video.statistics.likeCount || 0).toLocaleString()}
                </div>
              </div>
            </div>
            {/* 플레이어 카드 */}
            {selectedVideoId === video.id && (
              <div className="p-4 border-t bg-gray-50 rounded-b-lg animate-fadeIn">
                <YouTube
                  key={video.id}
                  videoId={video.id}
                  onReady={handleYoutubeReady}
                  onStateChange={handleYoutubeStateChange}
                  onEnd={handleYoutubeEnd}
                  opts={{
                    width: "100%",
                    height: "220",
                    playerVars: { autoplay: 1, controls: 1, modestbranding: 1, rel: 0 },
                  }}
                  className="rounded"
                />
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
                        onClick={() => setLiked(l => !l)}
                        className={`flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-full font-semibold transition-all duration-200 ${liked ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'}`}
                      >
                        <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="font-semibold">{(likeCount + (liked ? 1 : 0)).toLocaleString()}</span>
                      </button>
                      {/* 인증 버튼 */}
                      <button
                        onClick={handleFanCertification}
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
                    {/* 두 번째 줄: 구독/좋아요 누르러 가기 버튼 */}
                    <button
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-all duration-200 hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span>유튜브에서 구독/좋아요 누르기</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {videos.length === 0 && (
        <div className="text-center text-gray-400 py-8">영상이 없습니다.</div>
      )}
    </div>
  );
}

export default Home;