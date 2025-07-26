// 📺 비디오 섹션 컴포넌트
// 원본: Home.js에서 추출

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';

export const VideoSection = ({
  userCategory,
  currentUser,
  loadingUcraVideos,
  ucraVideos,
  uniqueVideos,
  visibleCount,
  setVisibleCount,
  handleVideoSelect,
  handleFanCertification,
  // YouTube 플레이어 관련 props
  selectedVideoId,
  playerLoading,
  watchSeconds,
  liked,
  setLiked,
  likeCount,
  setLikeCount,
  fanCertified,
  videoDuration,
  videoEnded,
  handleYoutubeReady,
  handleYoutubeStateChange,
  handleYoutubeEnd,
  playerRef  // playerRef 추가
}) => {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-4">
        <h3 className="text-3xl mb-2">
          <span className="inline-block align-middle mr-2">📺</span>
          <span className="text-xl font-bold align-middle">UCRA에 등록된 나와 매칭 영상순위</span>
        </h3>
        {userCategory ? (
          <div className="flex items-center justify-center gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full text-white ${userCategory.color || 'bg-blue-500'}`}>
              <span>{userCategory.icon || '📺'}</span>
              <span>{userCategory.name || '카테고리'}</span>
            </span>
            <span className="text-sm text-gray-500">카테고리 기반 추천</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {currentUser ? '마이채널에서 카테고리를 설정하면 맞춤 영상을 볼 수 있어요!' : '로그인하면 맞춤 영상을 볼 수 있어요!'}
          </p>
        )}
      </div>
      
      {!currentUser ? (
        <div className="text-center py-12">
          <p className="text-gray-700 mb-6 px-4 leading-relaxed text-base sm:text-lg font-medium whitespace-pre-line">
            당신과 유사한 채널을 운영하는 사람들이<br />
            어떤 영상을 만들었는지 궁금하다면?<br />
            <span className="font-bold text-blue-600">지금 로그인하고 확인해 보세요!</span>
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-semibold shadow-md"
          >
            로그인 / 회원가입
          </button>
        </div>
      ) : loadingUcraVideos ? (
        <div className="text-center py-8">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500">영상 불러오는 중...</p>
        </div>
      ) : ucraVideos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">아직 등록된 영상이 없습니다.</p>
          <button
            onClick={() => navigate('/chat')}
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            채팅방에서 영상 공유하기 →
          </button>
        </div>
      ) : (
        <motion.div className="space-y-3">
          <AnimatePresence>
            {uniqueVideos.slice(0, visibleCount).map((video, idx) => {
              const ucraViewCount = video.ucraViewCount?.toLocaleString() || '0';
              const ucraLikes = video.ucraLikes?.toLocaleString() || '0';
              const watching = Math.floor(Math.random() * 50) + 10;
              const rankChange = idx < 3 ? Math.floor(Math.random() * 3) + 1 : 0;
            
              return (
                <motion.div
                  key={video.videoId}
                  className="card card-hover p-2.5 cursor-pointer"
                  onClick={() => handleVideoSelect(video.videoId)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                <div className="flex gap-2.5 items-start">
                  <div className="flex flex-col items-center min-w-[35px] mt-1">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md
                      ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 
                        idx === 1 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 
                        idx === 2 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 
                        'bg-gradient-to-br from-gray-400 to-gray-500'}
                    `}>
                      {idx + 1}
                    </div>
                    {rankChange > 0 && idx < 3 && (
                      <div className="flex items-center mt-1">
                        <span className="text-green-500 text-xs">↑{rankChange}</span>
                      </div>
                    )}
                  </div>

                  <div className="relative flex-shrink-0">
                    <img 
                      src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-32 h-18 object-cover rounded-lg shadow-lg"
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1 leading-tight text-sm">
                      {video.title}
                    </h4>
                    <p className="text-xs text-gray-500 mb-1.5 truncate font-medium">{video.durationDisplay || '시간 미확인'}</p>
                    
                    {/* UCRA 내 통계 */}
                    <div className="flex items-center gap-2.5 text-xs mb-1">
                      <div className="flex items-center text-red-500">
                        <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">{ucraLikes}</span>
                      </div>
                      <div className="flex items-center text-purple-500">
                        <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">{ucraViewCount}</span>
                      </div>
                      <div className="flex items-center text-green-500">
                        <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">{watching}명</span>
                      </div>
                    </div>
                    
                    {/* UCRA 표시 */}
                    <div className="text-xs text-blue-600 font-medium">
                      🎯 UCRA 순위 #{idx + 1}
                    </div>
                  </div>
                </div>
                
                {/* YouTube 플레이어 */}
                {selectedVideoId === video.videoId && (
                  <div className="relative mt-3">
                    {playerLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <span className="text-gray-500">영상 로딩 중...</span>
                      </div>
                    )}
                    <YouTube
                      key={video.videoId}
                      videoId={video.videoId}
                      onReady={handleYoutubeReady}
                      onStateChange={handleYoutubeStateChange}
                      onEnd={handleYoutubeEnd}
                      opts={{
                        width: "100%",
                        height: "200",
                        playerVars: {
                          autoplay: 1,
                          controls: 1,          // YouTube 기본 컨트롤바 활성화
                          rel: 0,               // 관련 영상 비활성화
                          modestbranding: 0,    // YouTube 로고 표시 (컨트롤바 가시성 향상)
                          fs: 1,                // 전체화면 버튼 활성화
                          cc_load_policy: 0,    // 자막 버튼 표시
                          iv_load_policy: 3,    // 주석 숨기기
                        },
                      }}
                    />
                    {/* 플레이어 컨트롤 */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                          시청 시간: <span className="font-bold text-blue-600">{watchSeconds}초</span>
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLiked(!liked);
                              setLikeCount(prev => liked ? prev - 1 : prev + 1);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              liked 
                                ? 'bg-pink-500 text-white' 
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50'
                            }`}
                          >
                            ❤️ {likeCount.toLocaleString()}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFanCertification();
                            }}
                            disabled={(!fanCertified) && (videoDuration >= 180 ? watchSeconds < 180 : !videoEnded)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              fanCertified 
                                ? 'bg-green-500 text-white cursor-default' 
                                : (videoDuration >= 180 ? watchSeconds >= 180 : videoEnded)
                                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {fanCertified ? '✅ 인증완료' : '⭐ 시청인증'}
                          </button>
                        </div>
                      </div>
                      
                      {/* 진행률 바 */}
                      {videoDuration > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min((watchSeconds / videoDuration) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      )}
                      
                      {/* 방입장 및 유튜브 연결 버튼 */}
                      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chat/${video.roomId}/profile`);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          🚪 방 입장하기
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank');
                          }}
                          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          ❤️ 구독/좋아요
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {visibleCount < uniqueVideos.length && (
            <div className="text-center mt-6">
              <button
                onClick={() => setVisibleCount(prev => Math.min(prev + 5, uniqueVideos.length))}
                className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full font-bold hover:bg-blue-200 transition-all duration-200"
              >
                더보기 ({uniqueVideos.length - visibleCount}개 남음)
              </button>
            </div>
          )}

          {visibleCount > 5 && (
            <div className="text-center mt-2">
              <button
                onClick={() => setVisibleCount(5)}
                className="px-4 py-1 text-gray-500 hover:text-gray-700 text-sm transition-all duration-200"
              >
                접기 ↑
              </button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
