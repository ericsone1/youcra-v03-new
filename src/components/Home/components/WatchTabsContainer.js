import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 샘플 시청할 영상 데이터
const SAMPLE_WATCH_VIDEOS = [
  {
    id: 'watch1',
    title: '크리에이터를 위한 최고의 마케팅 전략',
    thumbnail: 'https://i.ytimg.com/vi/sample6/maxresdefault.jpg',
    duration: '15:30',
    type: 'long',
    progress: 0,
    creator: {
      name: '디지털 마케터',
      avatar: 'https://i.pravatar.cc/150?img=1'
    }
  },
  {
    id: 'watch2',
    title: '[쇼츠] 1분 만에 보는 채널 성장 비결',
    thumbnail: 'https://i.ytimg.com/vi/sample7/maxresdefault.jpg',
    duration: '0:58',
    type: 'short',
    progress: 30,
    creator: {
      name: '쇼츠 마스터',
      avatar: 'https://i.pravatar.cc/150?img=2'
    }
  },
  // ... 더 많은 샘플 데이터
];

// 샘플 시청자 데이터
const SAMPLE_VIEWERS = [
  {
    id: 'viewer1',
    name: '열심히보는팬',
    avatar: 'https://i.pravatar.cc/150?img=3',
    watchCount: 15,
    lastWatched: '2024-03-15T10:00:00Z'
  },
  {
    id: 'viewer2',
    name: '영상매니아',
    avatar: 'https://i.pravatar.cc/150?img=4',
    watchCount: 8,
    lastWatched: '2024-03-15T09:30:00Z'
  },
  // ... 더 많은 샘플 데이터
];

export const WatchTabsContainer = ({
  activeTab,
  onTabChange,
  videoFilter,
  onFilterChange,
  selectedVideos,
  onTokenEarned
}) => {
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) return `${minutes}분 전`;
    return `${hours}시간 전`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      {/* 메인 탭 */}
      <div className="flex border-b">
        <button
          onClick={() => onTabChange('watch')}
          className={`flex-1 py-4 text-sm font-medium transition-colors relative
            ${activeTab === 'watch'
              ? 'text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          내가 시청할 영상
          {activeTab === 'watch' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            />
          )}
        </button>
        <button
          onClick={() => onTabChange('viewers')}
          className={`flex-1 py-4 text-sm font-medium transition-colors relative
            ${activeTab === 'viewers'
              ? 'text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          내 영상 시청자
          {activeTab === 'viewers' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
            />
          )}
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="flex p-2 gap-2 bg-gray-50">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors
            ${videoFilter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
        >
          전체
        </button>
        <button
          onClick={() => onFilterChange('short')}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors
            ${videoFilter === 'short'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
        >
          숏폼
        </button>
        <button
          onClick={() => onFilterChange('long')}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors
            ${videoFilter === 'long'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
        >
          롱폼
        </button>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'watch' ? (
            <motion.div
              key="watch"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {SAMPLE_WATCH_VIDEOS
                .filter(video => 
                  videoFilter === 'all' || video.type === videoFilter
                )
                .map(video => (
                  <div
                    key={video.id}
                    className="flex gap-3 bg-gray-50 rounded-xl p-3"
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
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={video.creator.avatar}
                          alt={video.creator.name}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-sm text-gray-600">
                          {video.creator.name}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                        {video.title}
                      </h3>
                      
                      {/* 진행률 바 */}
                      <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-blue-500"
                          style={{ width: `${video.progress}%` }}
                        />
                      </div>
                      
                      {/* 시청 버튼 */}
                      <button
                        onClick={() => {
                          // TODO: 실제 시청 로직
                          onTokenEarned();
                        }}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors"
                      >
                        시청하기
                      </button>
                    </div>
                  </div>
                ))}
            </motion.div>
          ) : (
            <motion.div
              key="viewers"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {SAMPLE_VIEWERS.map(viewer => (
                <div
                  key={viewer.id}
                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                >
                  <img
                    src={viewer.avatar}
                    alt={viewer.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900">
                      {viewer.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      총 {viewer.watchCount}개 시청 • {formatTimeAgo(viewer.lastWatched)}
                    </p>
                  </div>
                  <button
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 transition-colors"
                  >
                    메시지
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}; 