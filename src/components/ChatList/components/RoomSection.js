import React from 'react';
import { FaPlus } from "react-icons/fa";
import RoomCard from './RoomCard';

function RoomSection({ 
  title, 
  rooms, 
  visibleCount, 
  onLoadMore, 
  onEnter, 
  showCreateButton = false,
  onCreateClick,
  emptyMessage 
}) {
  return (
    <div className="mb-4">
      {/* 섹션 헤더 */}
      <div className="mb-2 mt-2 flex items-center justify-between">
        <span className="text-base font-bold text-blue-700">{title}</span>
        {showCreateButton && (
          <button
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full shadow font-bold text-sm hover:bg-blue-600 transition"
            onClick={onCreateClick}
          >
            <FaPlus /> 방 생성하기
          </button>
        )}
      </div>

      {/* 방 목록 */}
      {rooms.slice(0, visibleCount).length === 0 ? (
        <div className="text-sm text-gray-400 mb-2">{emptyMessage}</div>
      ) : (
        <div className="space-y-3">
          {rooms.slice(0, visibleCount).map(room => (
            <RoomCard 
              key={room.id} 
              room={room} 
              onEnter={onEnter} 
            />
          ))}
        </div>
      )}

      {/* 더보기 버튼 */}
      {rooms.length > visibleCount && (
        <div className="text-center mt-2">
          <button
            className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full font-bold hover:bg-blue-200 transition"
            onClick={onLoadMore}
          >
            더보기
          </button>
        </div>
      )}
    </div>
  );
}

export default RoomSection; 