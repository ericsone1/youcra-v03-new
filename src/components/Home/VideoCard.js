import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from './VideoPlayer';

// 영상 길이 포맷팅 함수
const formatDuration = (duration) => {
  if (!duration) return '시간 미확인';
  
  // YouTube 형식 (PT1M30S)을 초 단위로 변환
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
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

function VideoCard({ 
  video, 
  index, 
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
  const likeCountDisplay = Number(video.statistics.likeCount || 0).toLocaleString();
  const viewCountDisplay = Number(video.statistics.viewCount || 0).toLocaleString();
  const watchingCount = video.watchCount || 0;
  const certificationCount = video.certificationCount || 0;

  // 디버깅: 채널ID 위치 확인
  console.log('video:', video);
  console.log('video.snippet:', video.snippet);
  console.log('video.snippet.channelId:', video.snippet && video.snippet.channelId);
  console.log('video.channelId:', video.channelId);

  return (
    <motion.div
      key={video.id}
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
            <span className="text-green-500 text-xs font-medium mt-0.5">
              HOT
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
          <div className="text-xs text-gray-500 mb-1.5 truncate font-medium">
            {video.contentDetails?.duration ? formatDuration(video.contentDetails.duration) : '시간 미확인'}
          </div>
          
          {/* 채팅방 정보 */}
          {video.roomName && (
            <div className="flex items-center text-purple-600 mb-1 text-xs">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{video.roomName}</span>
            </div>
          )}
          
          {/* 통계 */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex items-center text-red-500">
              <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{likeCountDisplay}</span>
            </div>
            <div className="flex items-center text-blue-500">
              <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{viewCountDisplay}회</span>
            </div>
            <div className="flex items-center text-purple-500">
              <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              <span className="font-semibold">{watchingCount}시청</span>
            </div>
            <div className="flex items-center text-green-500">
              <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold">{certificationCount}인증</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* YouTube 플레이어 */}
      <AnimatePresence>
        {selectedVideoId === video.id && (
          <VideoPlayer
            video={video}
            watchSeconds={watchSeconds}
            videoDuration={videoDuration}
            canCertify={canCertify}
            fanCertified={fanCertified}
            liked={liked}
            likeCount={likeCount}
            onYoutubeReady={onYoutubeReady}
            onYoutubeStateChange={onYoutubeStateChange}
            onYoutubeEnd={onYoutubeEnd}
            onLikeToggle={onLikeToggle}
            onFanCertification={onFanCertification}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default VideoCard; 