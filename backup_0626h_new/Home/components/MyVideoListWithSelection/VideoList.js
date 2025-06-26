import React from 'react';
import { motion } from 'framer-motion';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const VideoList = ({ videos, selectedVideos, onVideoSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3"
    >
      {videos.map(video => (
        <div
          key={video.id}
          onClick={() => onVideoSelect(video)}
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
  );
}; 