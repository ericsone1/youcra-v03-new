import React from 'react';

function RoomCard({ room, onEnter }) {
  return (
    <div className="flex items-center bg-white rounded-xl shadow p-3 gap-3 hover:bg-blue-50 transition">
      {/* 썸네일 */}
      <div className="w-16 h-16 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-md">
        {room.name?.slice(0, 2).toUpperCase() || 'CH'}
      </div>
      
      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-base truncate mb-1">{room.title}</div>
        <div className="text-xs text-gray-500 truncate mb-2">{room.desc}</div>
        
        {/* 사람수, 좋아요 수 */}
        <div className="flex gap-4 text-xs text-gray-400 mb-2 items-center">
          <span className="flex items-center">
            <span className="mr-1">👥</span>{room.members}명
          </span>
          <span className="flex items-center">
            <span className="mr-1">❤️</span>{room.likes}
          </span>
        </div>
        
        {/* 해시태그 표시 */}
        {room.hashtags && room.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {room.hashtags.slice(0, 3).map((tag, i) => (
              <span 
                key={i} 
                className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
            {room.hashtags.length > 3 && (
              <span className="text-xs text-gray-400">
                +{room.hashtags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* 입장 버튼 */}
      <button
        className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold text-base hover:bg-blue-600 transition shadow-md"
        onClick={() => onEnter(room.id)}
      >
        입장하기
      </button>
    </div>
  );
}

export default RoomCard; 