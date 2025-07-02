import React from 'react';
import { motion } from 'framer-motion';

// 샘플 시청자 데이터
const SAMPLE_VIEWERS = [
  {
    id: '1',
    name: '김유튜버',
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    watchTime: 1800, // 30분
    isOnline: true
  },
  {
    id: '2', 
    name: '박크리에이터',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150&h=150&fit=crop&crop=face',
    watchTime: 2400, // 40분
    isOnline: true
  },
  {
    id: '3',
    name: '이시청자',
    profileImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face',
    watchTime: 900, // 15분
    isOnline: false
  }
];

// 시간 포맷 함수
const formatWatchTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
};

export const ViewerList = ({ onMessageClick }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">시청자 목록</h3>
      
      <div className="space-y-3">
        {SAMPLE_VIEWERS.map((viewer, index) => (
          <motion.div
            key={viewer.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={viewer.profileImage}
                  alt={viewer.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {viewer.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{viewer.name}</p>
                <p className="text-sm text-gray-500">
                  시청시간: {formatWatchTime(viewer.watchTime)}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => onMessageClick?.(viewer)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              메시지
            </button>
          </motion.div>
        ))}
      </div>
      
      {SAMPLE_VIEWERS.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>현재 시청자가 없습니다</p>
        </div>
      )}
    </div>
  );
}; 