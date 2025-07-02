import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoList } from './VideoList';
import { SelectedVideos } from './SelectedVideos';
import { API_KEY } from '../../utils/constants';

export const MyVideoListWithSelection = ({ channelInfo, selectedVideos, onVideosChange }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 영상 시간을 초를 분:초 형식으로 변환
  const formatDuration = (duration) => {
    if (!duration) return '0:00';
    
    // ISO 8601 duration format (PT4M13S) 파싱
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // 조회수 포맷팅
  const formatViewCount = (count) => {
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // 실제 YouTube API로 채널 영상 가져오기
  const fetchChannelVideos = async (channelId) => {
    if (!API_KEY) {
      throw new Error('YouTube API 키가 설정되지 않았습니다.');
    }

    try {
      // 1. 채널의 업로드 플레이리스트 ID 가져오기
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`
      );
      const channelData = await channelResponse.json();
      
      if (channelData.error) {
        throw new Error(channelData.error.message);
      }
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error('채널을 찾을 수 없습니다.');
      }
      
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
      
      // 2. 업로드 플레이리스트에서 영상 목록 가져오기
      const playlistResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${API_KEY}`
      );
      const playlistData = await playlistResponse.json();
      
      if (playlistData.error) {
        throw new Error(playlistData.error.message);
      }
      
      if (!playlistData.items || playlistData.items.length === 0) {
        return [];
      }
      
      // 3. 영상 ID 목록 추출
      const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');
      
      // 4. 영상 상세 정보 가져오기 (통계, 시간 등)
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
      );
      const videosData = await videosResponse.json();
      
      if (videosData.error) {
        throw new Error(videosData.error.message);
      }
      
      // 5. 데이터 변환
      return videosData.items.map(video => {
        const duration = formatDuration(video.contentDetails.duration);
        const isShort = video.contentDetails.duration && 
          (parseInt(video.contentDetails.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/)?.[1] || 0) === 0 && 
           parseInt(video.contentDetails.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/)?.[2] || 0) <= 60) ||
          (parseInt(video.contentDetails.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/)?.[1] || 0) === 1 && 
           parseInt(video.contentDetails.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/)?.[2] || 0) === 0);
        
        return {
          id: video.id,
          title: video.snippet.title,
          thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
          duration: duration,
          publishedAt: video.snippet.publishedAt,
          views: formatViewCount(video.statistics.viewCount || '0') + ' 조회',
          type: isShort ? 'short' : 'long'
        };
      });
      
    } catch (error) {
      console.error('YouTube API 오류:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchVideos = async () => {
      if (!channelInfo || !channelInfo.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const channelVideos = await fetchChannelVideos(channelInfo.id);
        setVideos(channelVideos);
      } catch (err) {
        console.error('영상 목록 로드 오류:', err);
        setError(err.message || '영상 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [channelInfo]);

  const handleVideoSelect = (video) => {
    if (selectedVideos.some(v => v.id === video.id)) {
      onVideosChange(selectedVideos.filter(v => v.id !== video.id));
    } else if (selectedVideos.length < 3) {
      onVideosChange([...selectedVideos, video]);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">영상 목록 불러오는 중...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="text-center text-red-500 py-8">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          📺 내 채널 영상
        </h2>
        {selectedVideos.length > 0 && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            {isCollapsed ? '목록 펼치기' : '목록 접기'}
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500">
          최대 3개의 영상을 선택할 수 있습니다. ({selectedVideos.length}/3)
        </p>
      </div>

      {/* 선택된 영상 미리보기 */}
      {selectedVideos.length > 0 && (
        <SelectedVideos
          selectedVideos={selectedVideos}
          onVideoRemove={handleVideoSelect}
        />
      )}

      {/* 영상 목록 */}
      <AnimatePresence>
        {!isCollapsed && (
          <VideoList
            videos={videos}
            selectedVideos={selectedVideos}
            onVideoSelect={handleVideoSelect}
          />
        )}
      </AnimatePresence>

      {/* 선택 완료 버튼 */}
      {selectedVideos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6"
        >
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            선택 완료
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}; 