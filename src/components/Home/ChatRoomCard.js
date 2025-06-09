import React from 'react';
import { motion } from 'framer-motion';

function ChatRoomCard({ room, index, onClick }) {
  return (
    <motion.button
      key={room.id}
      className="w-full flex items-center gap-3 hover:bg-blue-50 rounded-lg px-3 py-2 transition-all duration-200 text-left"
      onClick={() => onClick(room.id)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col items-center min-w-[50px]">
        <span className={`
          font-bold text-xs w-8 h-6 rounded-full flex items-center justify-center text-white shadow-md
          ${index === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
            index === 1 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 
            index === 2 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 
            'bg-gradient-to-r from-gray-400 to-gray-500'}
        `}>
          {index + 1}위
        </span>
      </div>
      
      <div className="flex-1">
        <div className="font-semibold text-gray-800 truncate max-w-[160px]">
          {room.name && room.name.length > 13 ? `${room.name.substring(0, 13)}...` : room.name}
        </div>
        
        {/* 해시태그 표시 */}
        {room.hashtags && room.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {room.hashtags.slice(0, 3).map((tag, tagIdx) => (
              <span key={tagIdx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                #{tag}
              </span>
            ))}
            {room.hashtags.length > 3 && (
              <span className="text-xs text-gray-400">+{room.hashtags.length - 3}</span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-end text-sm">
        {/* 사람수와 좋아요 수를 가로로 배치 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center text-blue-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            <span className="font-semibold">{room.participantCount}명</span>
          </div>
          
          <div className="flex items-center text-red-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="font-semibold">{room.likesCount || 0}</span>
          </div>
        </div>
        
        {/* 실시간 활성 상태 */}
        {room.isActive && (
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        )}
      </div>
    </motion.button>
  );
}

export default ChatRoomCard; 