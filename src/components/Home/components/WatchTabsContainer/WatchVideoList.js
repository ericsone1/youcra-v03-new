import React from 'react';
import { motion } from 'framer-motion';

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
  {
    id: 'watch3',
    title: '유튜브 알고리즘 완벽 분석',
    thumbnail: 'https://i.ytimg.com/vi/sample8/maxresdefault.jpg',
    duration: '8:45',
    type: 'long',
    progress: 60,
    creator: {
      name: '알고리즘 연구소',
      avatar: 'https://i.pravatar.cc/150?img=3'
    }
  }
];

export const WatchVideoList = ({ videoFilter, onTokenEarned }) => {
  return (
    <motion.div
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
  );
};