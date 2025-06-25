import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 샘플 비디오 데이터 (데모용)
const SAMPLE_VIDEOS = [
  {
    id: 'video1',
    title: '유크라 앱 소개 영상 - 크리에이터를 위한 최고의 플랫폼',
    thumbnail: 'https://i.ytimg.com/vi/sample1/maxresdefault.jpg',
    duration: '3:45',
    publishedAt: '2024-03-15T09:00:00Z',
    views: '1.2만',
    type: 'long' // 'short' | 'long'
  },
  {
    id: 'video2',
    title: '[쇼츠] 유크라 앱 1분 사용법',
    thumbnail: 'https://i.ytimg.com/vi/sample2/maxresdefault.jpg',
    duration: '0:58',
    publishedAt: '2024-03-14T15:30:00Z',
    views: '5.6만',
    type: 'short'
  },
  // ... 더 많은 샘플 비디오
];

export const MyVideoListWithSelection = ({ channelInfo, selectedVideos, onVideosChange }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // TODO: 실제 YouTube API 연동
        await new Promise(resolve => setTimeout(resolve, 1000));
        setVideos(SAMPLE_VIDEOS);
      } catch (err) {
        setError('영상 목록을 불러오는데 실패했습니다.');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <div className="mb-6 p-4 bg-blue-50 rounded-xl">
          <h3 className="text-sm font-medium text-blue-700 mb-3">
            ✅ 선택된 영상
          </h3>
          <div className="space-y-2">
            {selectedVideos.map(video => (
              <div
                key={video.id}
                className="flex items-center gap-3 bg-white p-2 rounded-lg"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-16 h-9 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {video.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {video.duration} • {video.views} 조회
                  </p>
                </div>
                <button
                  onClick={() => handleVideoSelect(video)}
                  className="text-red-500 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 영상 목록 */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {videos.map(video => (
              <div
                key={video.id}
                onClick={() => handleVideoSelect(video)}
                className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-colors
                  ${selectedVideos.some(v => v.id === video.id)
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                  }`}
              >
                {/* 썸네일 */}
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-32 h-18 object-cover rounded-lg"
                  />
                  <span className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                    {video.duration}
                  </span>
                  {video.type === 'short' && (
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
                      쇼츠
                    </span>
                  )}
                </div>

                {/* 영상 정보 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {video.title}
                  </h3>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>조회수 {video.views}</p>
                    <p>등록일 {formatDate(video.publishedAt)}</p>
                  </div>
                </div>

                {/* 선택 상태 */}
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${selectedVideos.some(v => v.id === video.id)
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300'
                    }`}
                  >
                    {selectedVideos.some(v => v.id === video.id) && '✓'}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
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