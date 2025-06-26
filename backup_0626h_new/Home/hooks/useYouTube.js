import { useState, useEffect } from 'react';

const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

export function useYouTube() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);

  // YouTube API에서 인기 영상 가져오기
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

  // 필터링된 영상 목록
  const filteredVideos = videos;

  const handleVideoSelect = (videoId) => {
    setSelectedVideoId(selectedVideoId === videoId ? null : videoId);
  };

  return {
    videos,
    loading,
    error,
    selectedVideoId,
    visibleCount,
    setVisibleCount,
    filteredVideos,
    handleVideoSelect
  };
} 