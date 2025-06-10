import React from 'react';

function RoomCard({ room, onEnter }) {
  return (
    <div className="flex items-center bg-white rounded-xl shadow p-4 gap-4 hover:bg-blue-50 transition">
      {/* 방장 프로필 이미지 */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shadow-lg border-2 border-white relative group">
        <img 
          src={`https://picsum.photos/seed/${room.hostId || room.id || 'room'}/100/100`}
          alt="방장 프로필"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white">${(room.hostNick || room.title || 'CH').slice(0, 2).toUpperCase()}</div>`;
          }}
        />
      </div>
      
      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-base truncate mb-1">{room.title}</div>
        <div className="text-xs text-gray-500 truncate mb-2">{room.desc}</div>
        
        {/* 방장 정보 추가 */}
        <div className="text-xs text-gray-400 mb-2">
          방장: {room.hostNick || '익명'}
        </div>
        
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
        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-base hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
        onClick={() => onEnter(room.id)}
      >
        입장하기
      </button>
    </div>
  );
}

export default RoomCard; 