import React from 'react';
import { motion } from 'framer-motion';

// 영상 길이 포맷팅 함수
const formatDuration = (duration) => {
  if (!duration) return '시간 미확인';
  
  // YouTube 형식 (PT1M30S)을 초 단위로 변환
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      const seconds = parseInt(match[3] || 0);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
  }
  
  return '시간 미확인';
};

function YouTubeVideoCard({ video, index, selectedVideoId, onVideoSelect }) {
  const viewCount = Number(video.statistics.viewCount).toLocaleString();
  const likeCountDisplay = Number(video.statistics.likeCount || 0).toLocaleString();
  const watching = Math.floor(Math.random() * 1000) + 100;
  const rankChange = index < 3 ? Math.floor(Math.random() * 3) + 1 : 0;

  return (
    <motion.div
      className="card card-hover p-2.5 cursor-pointer"
      onClick={() => onVideoSelect(video.id)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex gap-2.5 items-start">
        {/* 순위 배지 */}
        <div className="flex flex-col items-center min-w-[35px] mt-1">
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md
            ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 
              index === 1 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 
              index === 2 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 
              'bg-gradient-to-br from-gray-400 to-gray-500'}
          `}>
            {index + 1}
          </div>
          {index < 3 && (
            <span className="text-green-500 text-xs font-medium mt-0.5 flex items-center">
              <svg className="w-2 h-2 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {rankChange}
            </span>
          )}
        </div>
        
        {/* 썸네일 */}
        <div className="relative">
          <img
            src={video.snippet.thumbnails.medium.url}
            alt={video.snippet.title}
            className="w-32 h-18 object-cover rounded-lg shadow-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1 leading-tight text-sm">
            {video.snippet.title}
          </h4>
          <p className="text-xs text-gray-500 mb-1.5 truncate font-medium">
            {video.contentDetails?.duration ? formatDuration(video.contentDetails.duration) : '시간 미확인'}
          </p>
          
          {/* 통계 */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex items-center text-red-500">
              <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{likeCountDisplay}</span>
            </div>
            <div className="flex items-center text-indigo-500">
              <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{watching}명</span>
            </div>
          </div>
        </div>
      </div>

      {/* YouTube 플레이어는 별도 컴포넌트로 분리 예정 */}
      {selectedVideoId === video.id && (
        <div className="mt-3 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-600">YouTube 플레이어 컴포넌트 예정</p>
        </div>
      )}
    </motion.div>
  );
}

export default YouTubeVideoCard; 