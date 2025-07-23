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
        {/* 헤더 섹션 */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 rounded-2xl p-6 shadow-xl">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="bg-white bg-opacity-20 rounded-full p-3 mr-3">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white leading-tight">
                  콘텐츠 시청리스트
                </h2>
                <p className="text-purple-100 text-sm font-medium mt-1">
                  📱 UCRA 인기 영상 순위
                </p>
              </div>
            </div>
            <div className="bg-white bg-opacity-15 rounded-xl px-4 py-2 inline-block">
              <span className="text-white font-bold text-lg">0개 영상</span>
            </div>
          </div>
        </div>
        
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
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {/* 헤더 섹션 - 매우 눈에 띄게 */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 rounded-2xl p-6 shadow-xl">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-white bg-opacity-20 rounded-full p-3 mr-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white leading-tight">
                콘텐츠 시청리스트
              </h2>
              <p className="text-purple-100 text-sm font-medium mt-1">
                📱 UCRA 인기 영상 순위
              </p>
            </div>
          </div>
          <div className="bg-white bg-opacity-15 rounded-xl px-4 py-2 inline-block">
            <span className="text-white font-bold text-lg">{filteredVideos.length}개 영상</span>
          </div>
        </div>
      </div>
      
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
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
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