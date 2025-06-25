import React from 'react';
import { motion } from 'framer-motion';
import { FaUsers } from 'react-icons/fa';

const MyVideosTab = ({ selectedVideos, myVideos, mockMyVideos, handleImageError }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="space-y-3 mx-4"
  >
    {selectedVideos.map((videoId, index) => {
      const video = (myVideos.length > 0 ? myVideos : mockMyVideos).find(v => v.id === videoId);
      if (!video) return null;
      return (
        <motion.div
          key={video.id}
          className="bg-white rounded-2xl p-4 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
        >
          <div className="flex gap-3 mb-3">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-20 h-14 rounded-lg object-cover"
              onError={handleImageError}
            />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">{video.title}</h4>
              <div className="text-xs text-gray-500">
                <span>{video.duration}</span>
                <span className="ml-2">현재 시청자 {video.currentViewers}명</span>
              </div>
            </div>
          </div>
          {/* 시청률 게이지 */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">시청 진행률</span>
              <span className="font-medium">{video.watchProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${video.watchProgress}%` }}
                transition={{ duration: 1, delay: 0.2 * index }}
                className="h-full bg-green-500 rounded-full"
              />
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>총 시청자 {video.totalViewers}명</span>
            <span>누적 시청 완료</span>
          </div>
        </motion.div>
      );
    })}
    {selectedVideos.length === 0 && (
      <div className="text-center py-8 text-gray-500">
        <FaUsers className="text-4xl mx-auto mb-2 opacity-30" />
        <p>등록된 영상이 없습니다</p>
      </div>
    )}
  </motion.div>
);

export default React.memo(MyVideosTab); 