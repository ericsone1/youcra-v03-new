import React from 'react';
import { motion } from 'framer-motion';
import YouTube from 'react-youtube';
import { useNavigate } from 'react-router-dom';

function VideoPlayer({ 
  video,
  watchSeconds,
  videoDuration,
  canCertify,
  fanCertified,
  liked,
  likeCount,
  onYoutubeReady,
  onYoutubeStateChange,
  onYoutubeEnd,
  onLikeToggle,
  onFanCertification
}) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-3"
    >
      <div className="rounded-lg shadow-lg youtube-player">
        <YouTube
          key={video.id}
          videoId={video.id}
          onReady={onYoutubeReady}
          onStateChange={onYoutubeStateChange}
          onEnd={onYoutubeEnd}
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1,
              controls: 1, // 플레이어 컨트롤 표시
              modestbranding: 0, // YouTube 로고 표시
              rel: 0, // 관련 동영상 숨김
              enablejsapi: 1,
              playsinline: 1, // 모바일에서 인라인 재생
              fs: 1, // 전체화면 활성화
              disablekb: 0, // 키보드 컨트롤 활성화
              start: 0 // 처음부터 재생
            },
          }}
        />
      </div>
      
      <div className="mt-2 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-600 font-medium">
            시청 시간: {Math.floor(watchSeconds / 60)}:{(watchSeconds % 60).toString().padStart(2, '0')}
          </span>
          <span className="text-gray-500">
            전체: {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')}
          </span>
        </div>
        
        {/* 진행률 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min((watchSeconds / videoDuration) * 100, 100)}%` }}
          />
        </div>
        
        {/* 안내 문구 */}
        <div className="text-xs text-gray-500 text-center">
          {videoDuration >= 180
            ? `3분 이상 시청 시 인증 가능`
            : `영상 끝까지 시청 시 인증 가능`}
        </div>
        
        {/* 버튼들 */}
        <div className="flex flex-col gap-2 mt-2">
          {/* 첫 번째 줄: 좋아요, 인증 버튼 */}
          <div className="flex gap-2">
            {/* 좋아요 버튼 */}
            <button
              onClick={onLikeToggle}
              className={`flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-full font-semibold transition-all duration-200 ${
                liked ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'
              }`}
            >
              <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-semibold">{(likeCount + (liked ? 1 : 0)).toLocaleString()}</span>
            </button>
            
            {/* 인증 버튼 */}
            <button
              onClick={onFanCertification}
              disabled={!canCertify || fanCertified}
              className={`flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-full font-semibold transition-all duration-200 ${
                fanCertified ? 'bg-green-500 text-white' : 
                canCertify ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105' : 
                'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {fanCertified ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">인증완료</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold">시청인증</span>
                </>
              )}
            </button>
          </div>
          
          {/* 두 번째 줄: 구독/좋아요, 채팅방 이동 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-all duration-200 hover:scale-105 text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>유튜브</span>
            </button>
            
            {video.roomId && (
              <button
                onClick={() => navigate(`/chat/${video.roomId}`)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-600 transition-all duration-200 hover:scale-105 text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span>채팅방</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default VideoPlayer; 