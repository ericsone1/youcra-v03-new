import React, { useEffect, useState } from "react";

const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">🔥 실시간 인기 유튜브 영상</h2>
      <ul>
        {videos.map((video) => (
          <li
            key={video.id}
            className="flex gap-4 items-center mb-4 p-3 bg-white rounded-lg shadow hover:bg-blue-50 transition"
          >
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