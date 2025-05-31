import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import { AnimatePresence, motion } from "framer-motion";

const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

// 실시간 검색어 순위 예시 데이터
const trendingKeywords = [
  { keyword: "유크라 공구", change: 2 },
  { keyword: "유튜브 쇼츠", change: 0 },
  { keyword: "인스타그램 릴스", change: -1 },
  { keyword: "틱톡 챌린지", change: 0 },
  { keyword: "네이버쇼츠", change: 0 },
];

function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=20&regionCode=KR&key=${API_KEY}`
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

  const filteredVideos = videos.filter(
    (video) =>
      video.snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.snippet.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 뒤로가기(검색 초기화) 핸들러
  const handleBack = () => setSearchQuery("");

  // 검색어 순위 클릭 시 페이지 이동
  const handleKeywordClick = (keyword) => {
    navigate(`/search?query=${encodeURIComponent(keyword)}`);
  };

  // 검색창 엔터키 처리
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // 영상 선택 시 좋아요 상태 초기화
  useEffect(() => {
    setLiked(false);
    if (selectedVideoId) {
      const video = filteredVideos.find(v => v.id === selectedVideoId);
      setLikeCount(video ? Number(video.statistics.likeCount || 0) : 0);
    }
    setWatchSeconds(0);
  }, [selectedVideoId, filteredVideos]);

  // 플레이어 핸들러
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
  };
  const handleYoutubeStateChange = (event) => {
    if (event.data === 1) {
      if (playerRef.current && !playerRef.current._interval) {
        playerRef.current._interval = setInterval(() => {
          setWatchSeconds((prev) => prev + 1);
        }, 1000);
      }
      setIsPlaying(true);
    } else {
      if (playerRef.current && playerRef.current._interval) {
        clearInterval(playerRef.current._interval);
        playerRef.current._interval = null;
      }
      setIsPlaying(false);
    }
  };
  useEffect(() => {
    return () => {
      if (playerRef.current && playerRef.current._interval) {
        clearInterval(playerRef.current._interval);
        playerRef.current._interval = null;
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
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* 헤더 섹션 */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">UCRA</h1>
          <p className="text-gray-600">유튜브 크리에이터들의 공간</p>
        </div>

        {/* 실시간 검색어 순위 박스 */}
        <motion.div 
          className="card card-hover p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center mb-4">
            {searchQuery ? (
              <button 
                onClick={handleBack} 
                className="mr-3 p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-all duration-200" 
                aria-label="뒤로가기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : null}
            <h2 className="text-2xl font-bold text-center flex-1 flex items-center justify-center">
              <span className="mr-2">🔥</span>
              실시간 검색어 순위
            </h2>
          </div>
          
          {/* 검색창 */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="영상 제목, 채널명 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full p-4 pr-12 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* 검색어 순위 리스트 */}
          <div className="space-y-2">
            {trendingKeywords.map((item, idx) => (
              <motion.button
                key={item.keyword}
                className="w-full flex items-center gap-4 hover:bg-blue-50 rounded-xl px-4 py-3 transition-all duration-200 text-left"
                onClick={() => handleKeywordClick(item.keyword)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className={`
                  font-bold text-lg w-8 h-8 rounded-full flex items-center justify-center text-white
                  ${idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
                    idx === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 
                    idx === 2 ? 'bg-gradient-to-r from-red-400 to-red-600' : 
                    'bg-gradient-to-r from-gray-400 to-gray-600'}
                `}>
                  {idx + 1}
                </span>
                <span className="flex-1 font-medium text-gray-800">{item.keyword}</span>
                <div className="flex items-center">
                  {item.change > 0 && (
                    <span className="text-green-500 text-sm font-bold flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      {item.change}
                    </span>
                  )}
                  {item.change < 0 && (
                    <span className="text-red-500 text-sm font-bold flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 15.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {Math.abs(item.change)}
                    </span>
                  )}
                  {item.change === 0 && (
                    <span className="text-gray-400 text-sm font-bold">-</span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 실시간 시청순위 리스트 */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📺 실시간 UCRA 시청순위
          </h3>
          
          <div className="space-y-4">
            {filteredVideos.slice(0, visibleCount).map((video, idx) => {
              const viewCount = Number(video.statistics.viewCount).toLocaleString();
              const likeCountDisplay = Number(video.statistics.likeCount || 0).toLocaleString();
              const watching = Math.floor(Math.random() * 1000) + 100;
              const rankChange = idx < 3 ? Math.floor(Math.random() * 3) + 1 : 0;
              
              return (
                <motion.div
                  key={video.id}
                  className="card card-hover p-4 cursor-pointer"
                  onClick={() => setSelectedVideoId(selectedVideoId === video.id ? null : video.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex gap-4 items-center">
                    {/* 순위 배지 */}
                    <div className="flex flex-col items-center min-w-[60px]">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg
                        ${idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
                          idx === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 
                          idx === 2 ? 'bg-gradient-to-r from-red-400 to-red-600' : 
                          'bg-gradient-to-r from-gray-400 to-gray-600'}
                      `}>
                        {idx + 1}
                      </div>
                      {idx < 3 && (
                        <span className="text-green-500 text-sm font-bold mt-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
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
                        className="w-32 h-20 object-cover rounded-xl shadow-md"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 line-clamp-2 mb-2 leading-snug">
                        {video.snippet.title}
                      </h4>
                      <p className="text-sm text-gray-500 mb-3">{video.snippet.channelTitle}</p>
                      
                      {/* 통계 */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center text-pink-500">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          {likeCountDisplay}
                        </div>
                        <div className="flex items-center text-blue-500">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {watching}명 시청 중
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
                        className="mt-4 overflow-hidden"
                      >
                        <div className="rounded-xl overflow-hidden shadow-lg">
                          <YouTube
                            videoId={video.id}
                            onReady={handleYoutubeReady}
                            onStateChange={handleYoutubeStateChange}
                            opts={{
                              width: "100%",
                              height: "240",
                              playerVars: {
                                autoplay: 1,
                                modestbranding: 1,
                                rel: 0,
                              },
                            }}
                          />
                        </div>
                        
                        {/* 시청 시간 및 좋아요 */}
                        <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-xl">
                          <div className="text-sm text-gray-600">
                            시청 시간: <span className="font-bold text-blue-600">{watchSeconds}초</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLiked(!liked);
                              setLikeCount(prev => liked ? prev - 1 : prev + 1);
                            }}
                            className={`
                              flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200
                              ${liked 
                                ? 'bg-pink-500 text-white shadow-lg' 
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'
                              }
                            `}
                          >
                            <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="font-semibold">{likeCount.toLocaleString()}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
          
          {/* 더보기 버튼 */}
          {visibleCount < filteredVideos.length && (
            <motion.div 
              className="text-center pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button
                onClick={() => setVisibleCount(prev => prev + 5)}
                className="btn-secondary"
              >
                더 많은 영상 보기 ({filteredVideos.length - visibleCount}개 남음)
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Home;