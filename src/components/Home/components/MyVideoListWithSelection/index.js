import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoList } from './VideoList';
import { SelectedVideos } from './SelectedVideos';
import { SAMPLE_VIDEOS } from './sampleData';

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