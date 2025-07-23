import React from 'react';
import { motion } from 'framer-motion';
import YouTubeVideoCard from './YouTubeVideoCard';

function YouTubeSection({
  videos,
  filteredVideos,
  visibleCount,
  setVisibleCount,
  selectedVideoId,
  onVideoSelect
}) {
  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
        📺 실시간 UCRA 시청순위
      </h3>
      
      <div className="space-y-3">
        {filteredVideos.slice(0, visibleCount).map((video, idx) => (
          <YouTubeVideoCard 
            key={video.id}
            video={video}
            index={idx}
            selectedVideoId={selectedVideoId}
            onVideoSelect={onVideoSelect}
          />
        ))}
        
        {/* 더보기 버튼 */}
        {visibleCount < videos.length && (
          <div className="text-center mt-4">
            <button
              onClick={() => setVisibleCount(visibleCount + 3)}
              className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full font-bold hover:bg-blue-200 transition-all duration-200"
            >
              더보기 ({videos.length - visibleCount}개 더)
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default YouTubeSection; 