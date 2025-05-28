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
  const [selectedVideo, setSelectedVideo] = useState(null);
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

  // 영상 클릭 시 플레이어 노출
  const handleVideoClick = (video) => {
    const watching = Math.floor(Math.random()*1000)+100;
    const likeCount = Number(video.statistics.likeCount || 0);
    setSelectedVideo({
      ...video,
      watching,
      likeCount,
    });
    setWatchSeconds(0);
    setIsPlaying(false);
  };

  // 플레이어 닫기
  const handleClosePlayer = () => {
    setSelectedVideo(null);
    setWatchSeconds(0);
    setIsPlaying(false);
    if (playerRef.current && playerRef.current._interval) {
      clearInterval(playerRef.current._interval);
      playerRef.current._interval = null;
    }
  };

  // YouTube 플레이어 이벤트 핸들러
  const handleYoutubeReady = (event) => {
    playerRef.current = event.target;
    console.log('YouTube player ready');
  };

  const handleYoutubeStateChange = (event) => {
    console.log('YouTube state changed:', event.data);
    if (event.data === 1) { // 재생 중
      console.log('Video is playing');
      setIsPlaying(true);
      if (playerRef.current && !playerRef.current._interval) {
        console.log('Starting watch time counter');
        playerRef.current._interval = setInterval(() => {
          setWatchSeconds((prev) => {
            const newTime = prev + 1;
            console.log('Watch time:', newTime);
            return newTime;
          });
        }, 1000);
      }
    } else if (event.data === 2 || event.data === 0) { // 일시정지 또는 종료
      console.log('Video is paused or ended');
      setIsPlaying(false);
      if (playerRef.current && playerRef.current._interval) {
        clearInterval(playerRef.current._interval);
        playerRef.current._interval = null;
      }
    }
  };

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (playerRef.current && playerRef.current._interval) {
        clearInterval(playerRef.current._interval);
        playerRef.current._interval = null;
      }
    };
  }, []);

  // 영상 선택 시 좋아요 상태 초기화
  useEffect(() => {
    setLiked(false);
    setLikeCount(selectedVideo ? (selectedVideo.likeCount || 0) : 0);
  }, [selectedVideo]);

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* 실시간 검색어 순위 박스 */}
      <div className="bg-blue-100 rounded-xl p-4 mb-6">
        <div className="flex items-center mb-2">
          {searchQuery ? (
            <button onClick={handleBack} className="mr-2 text-xl text-gray-600 hover:text-blue-600" aria-label="뒤로가기">
              ←
            </button>
          ) : null}
          <h2 className="text-xl font-bold text-center flex-1">🔥 실시간 검색어 순위</h2>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="영상 제목, 채널명 검색"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full p-2 mb-3 border border-gray-300 rounded"
          />
        </div>
        <ol className="mb-2">
          {trendingKeywords.map((item, idx) => (
            <li key={item.keyword} className="flex items-center gap-2 mb-1">
              <button
                className="flex items-center flex-1 hover:bg-blue-200 rounded px-2 py-1 transition"
                onClick={() => handleKeywordClick(item.keyword)}
                style={{ outline: 'none', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <span className={`font-bold text-lg ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-blue-500' : idx === 2 ? 'text-red-500' : 'text-gray-700'}`}>{idx+1}</span>
                <span className="flex-1 font-medium text-left ml-2">{item.keyword}</span>
                {item.change > 0 && <span className="text-green-500 text-xs ml-1">▲{item.change}</span>}
                {item.change < 0 && <span className="text-red-500 text-xs ml-1">▼{Math.abs(item.change)}</span>}
                {item.change === 0 && <span className="text-gray-400 text-xs ml-1">-</span>}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* 선택된 영상 플레이어 UI (고정) */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            key="player"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-lg bg-white rounded-xl shadow-lg p-4 relative z-10 mb-4"
            style={{ position: 'sticky', top: 0 }}
          >
            {/* 닫기 버튼 */}
            <button onClick={handleClosePlayer} className="absolute top-2 right-2 text-xl text-gray-400 hover:text-gray-700" aria-label="닫기">×</button>
            {/* 제목 */}
            <div className="font-bold text-sm mb-2 pr-6 truncate" title={selectedVideo.snippet.title}>{selectedVideo.snippet.title}</div>
            {/* 유튜브 플레이어 */}
            <div className="mb-2">
              <YouTube
                videoId={selectedVideo.id}
                opts={{
                  width: '100%',
                  height: '220',
                  playerVars: { autoplay: 1 }
                }}
                onReady={handleYoutubeReady}
                onStateChange={handleYoutubeStateChange}
                className="rounded"
              />
            </div>
            {/* 시청 시간/인증 안내 */}
            <div className="text-xs text-gray-600 mb-2">
              {watchSeconds >= 180
                ? "3분 이상 시청 완료! 인증 가능"
                : `시청 시간: ${watchSeconds}초 (3분 이상 시 인증 가능)`}
            </div>
            <button
              className={`w-full py-2 rounded font-bold ${
                watchSeconds >= 180
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              disabled={watchSeconds < 180}
              onClick={() => {
                if (watchSeconds >= 180 && selectedVideo) {
                  const channelId = selectedVideo.snippet.channelId;
                  if (channelId) {
                    window.open(`https://www.youtube.com/channel/${channelId}`, '_blank');
                  }
                }
              }}
            >
              {watchSeconds >= 180 ? "해당 채널을 구독하러 이동" : "3분 이상 시청해야 인증 가능"}
            </button>
            {/* 구독 홍보 안내 문구 */}
            {watchSeconds >= 180 && (
              <div className="mt-2 text-xs text-green-700 font-semibold">
                영상을 시청하시고 구독하면  상대방에게도 내채널이 홍보됩니다.
              </div>
            )}
            <div className="flex gap-4 justify-between text-sm mt-2">
              <a
                href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center"
              >
                <span className="mr-1">🔔👍💬</span>
                구독과 좋아요, 댓글(유튜브로 이동)
              </a>
              {/* 하트 아이콘 (좋아요) */}
              <button
                className="ml-auto flex items-center focus:outline-none"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => {
                  if (!liked) {
                    setLiked(true);
                    setLikeCount((prev) => prev + 1);
                  } else {
                    setLiked(false);
                    setLikeCount((prev) => (prev > 0 ? prev - 1 : 0));
                  }
                }}
                aria-label="좋아요"
              >
                <span style={{ fontSize: 24, color: liked ? 'red' : '#bbb', transition: 'color 0.2s' }}>
                  {liked ? '♥' : '♡'}
                </span>
                <span className="ml-1 text-base text-gray-700">{likeCount}</span>
              </button>
              {/* 시청자수 */}
              <span className="ml-4 flex items-center text-blue-400 text-sm">
                👁️ {selectedVideo.watching}명
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 실시간 시청순위 리스트 */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-blue-700">실시간 UCRA 시청순위</h3>
        <ul>
          {filteredVideos.slice(0, visibleCount).map((video, idx) => {
            const viewCount = Number(video.statistics.viewCount).toLocaleString();
            const likeCount = Number(video.statistics.likeCount || 0).toLocaleString();
            const watching = Math.floor(Math.random()*1000)+100;
            const rankChange = idx < 3 ? Math.floor(Math.random()*3)+1 : 0;
            return (
              <li
                key={video.id}
                className="flex gap-4 items-center mb-4 p-3 bg-white rounded-lg shadow hover:bg-blue-50 transition cursor-pointer"
                onClick={() => handleVideoClick(video)}
              >
                {/* 순위 및 상승/하락 */}
                <div className="flex flex-col items-center w-14 min-w-[56px]">
                  <span className={`font-bold text-2xl ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-blue-400' : idx === 2 ? 'text-red-400' : 'text-gray-500'}`}>{idx+1}위</span>
                  <span className="block mt-1 text-base font-bold" style={{lineHeight:'1'}}>
                    {idx < 3 ? (
                      <span className="text-green-400">▲{rankChange}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </span>
                </div>
                {/* 썸네일 */}
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt={video.snippet.title}
                  className="w-28 h-16 object-cover rounded"
                />
                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate text-base mb-1">{video.snippet.title}</div>
                  <div className="text-xs text-gray-500 mb-1">{video.snippet.channelTitle}</div>
                  <div className="flex flex-col items-center justify-center mt-1">
                    <div className="flex gap-6 justify-center items-center text-lg font-bold">
                      <span className="flex items-center text-pink-400 text-sm">
                        ❤️ {likeCount}
                      </span>
                      <span className="flex items-center text-blue-400 text-sm">
                        👁️ {watching}명
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    조회수 {viewCount}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {filteredVideos.length > visibleCount && visibleCount < 20 && (
          <div className="text-center mt-2">
            <button
              className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full font-bold hover:bg-blue-200 transition"
              onClick={() => setVisibleCount(c => Math.min(c + 5, 20))}
            >
              더보기
            </button>
          </div>
        )}
        {filteredVideos.length === 0 && (
          <div className="text-center text-gray-400 py-8">검색 결과가 없습니다.</div>
        )}
      </div>
    </div>
  );
}

export default Home;