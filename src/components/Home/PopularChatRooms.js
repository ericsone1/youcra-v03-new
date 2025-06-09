import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SearchSection from './SearchSection';
import ChatRoomCard from './ChatRoomCard';

function PopularChatRooms({
  chatRooms,
  loadingRooms,
  searchQuery,
  setSearchQuery,
  filteredChatRooms,
  visibleRoomsCount,
  setVisibleRoomsCount,
  onRoomClick,
  onSearch,
  onSearchKeyDown
}) {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="card card-hover p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center mb-3 justify-center">
        <h2 className="text-xl font-bold text-center flex items-center justify-center">
          <span className="mr-2">🔥</span>
          실시간 인기 채팅방
        </h2>
      </div>
      
      <SearchSection 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={onSearch}
        onKeyDown={onSearchKeyDown}
      />
      
      {/* 인기 채팅방 순위 리스트 */}
      {loadingRooms ? (
        <div className="text-center py-8">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500">채팅방 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {(searchQuery ? filteredChatRooms : chatRooms).slice(0, visibleRoomsCount).map((room, idx) => (
            <ChatRoomCard
              key={room.id}
              room={room}
              index={idx}
              onClick={onRoomClick}
            />
          ))}
          
          {chatRooms.length === 0 && !loadingRooms && (
            <div className="text-center py-8 text-gray-500">
              <p>아직 활성화된 채팅방이 없습니다</p>
              <button
                onClick={() => navigate('/chat')}
                className="mt-2 text-blue-500 hover:text-blue-700 font-medium"
              >
                채팅방 만들러 가기 →
              </button>
            </div>
          )}
          
          {/* 더보기 버튼 */}
          {!searchQuery && chatRooms.length > visibleRoomsCount && visibleRoomsCount < 10 && (
            <div className="text-center mt-4">
              <button
                onClick={() => setVisibleRoomsCount(10)}
                className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full font-bold hover:bg-blue-200 transition-all duration-200"
              >
                더보기
              </button>
            </div>
          )}
          
          {/* 접기 버튼 */}
          {!searchQuery && visibleRoomsCount > 3 && (
            <div className="text-center mt-2">
              <button
                onClick={() => setVisibleRoomsCount(3)}
                className="px-4 py-1 text-gray-500 hover:text-gray-700 text-sm transition-all duration-200"
              >
                접기 ↑
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default PopularChatRooms; 