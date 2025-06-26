import { useState, useEffect } from 'react';
import { API_KEY } from '../utils/constants';

export const useYouTubeVideos = () => {
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

  return { videos, loading, error };
}; 