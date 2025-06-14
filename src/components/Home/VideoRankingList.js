import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard';

function VideoRankingList({ 
  videos, 
  searchQuery,
  selectedVideoId,
  watchSeconds,
  videoDuration,
  canCertify,
  fanCertified,
  liked,
  likeCount,
  onVideoSelect,
  onYoutubeReady,
  onYoutubeStateChange,
  onYoutubeEnd,
  onLikeToggle,
  onFanCertification
}) {
  const [visibleCount, setVisibleCount] = useState(5);
  const navigate = useNavigate();

  // 필터링된 영상
  const filteredVideos = videos.filter(
    (video) =>
      video.snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.snippet.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredVideos.length === 0) {
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
        
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">등록된 영상이 없습니다</h3>
          <p className="text-gray-600 mb-4">채팅방에서 첫 번째 영상을 등록해보세요!</p>
          <button 
            onClick={() => navigate('/chat')}
            className="btn-primary px-6 py-2"
          >
            채팅방 둘러보기
          </button>
        </div>
      </motion.div>
    );
  }

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
          <VideoCard
            key={video.id}
            video={video}
            index={idx}
            selectedVideoId={selectedVideoId}
            watchSeconds={watchSeconds}
            videoDuration={videoDuration}
            canCertify={canCertify}
            fanCertified={fanCertified}
            liked={liked}
            likeCount={likeCount}
            onVideoSelect={onVideoSelect}
            onYoutubeReady={onYoutubeReady}
            onYoutubeStateChange={onYoutubeStateChange}
            onYoutubeEnd={onYoutubeEnd}
            onLikeToggle={onLikeToggle}
            onFanCertification={onFanCertification}
          />
        ))}
        
        {/* 더보기 버튼 */}
        {visibleCount < filteredVideos.length && (
          <motion.div 
            className="text-center pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button
              onClick={() => setVisibleCount(prev => prev + 5)}
              className="btn-secondary text-sm py-2 px-4"
            >
              더 많은 영상 보기 ({filteredVideos.length - visibleCount}개 남음)
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default VideoRankingList; 