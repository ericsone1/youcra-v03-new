// 💬 채팅방 섹션 컴포넌트
// 원본: Home.js에서 추출

import React from 'react';
import { useNavigate } from 'react-router-dom';

export const ChatRoomSection = ({
  searchQuery,
  setSearchQuery,
  handleSearchKeyDown,
  handleSearch,
  loadingRooms,
  chatRooms,
  filteredChatRooms,
  visibleRoomsCount,
  setVisibleRoomsCount,
  handleRoomClick
}) => {
  const navigate = useNavigate();

  return (
    <div className="card card-hover p-4">
      <div className="flex items-center mb-3 justify-center">
        <h2 className="text-xl font-bold text-center flex items-center justify-center">
          <span className="mr-2">🔥</span>
          실시간 인기 채팅방
        </h2>
      </div>
      
      {/* 검색창 */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="채팅방 이름, 키워드, #해시태그 검색..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full p-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
        />
        <button 
          onClick={handleSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-blue-600 transition-colors duration-200 p-1"
          aria-label="검색"
        >
          <svg className="w-5 h-5 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
      
      {/* 인기 채팅방 순위 리스트 */}
      {loadingRooms ? (
        <div className="text-center py-8">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500">채팅방 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {(searchQuery ? filteredChatRooms : chatRooms).slice(0, visibleRoomsCount).map((room, idx) => (
            <button
              key={room.id}
              className="w-full flex items-center gap-3 hover:bg-blue-50 rounded-lg px-3 py-2 transition-all duration-200 text-left"
              onClick={() => handleRoomClick(room.id)}
            >
              <div className="flex flex-col items-center min-w-[50px]">
                <span className={`
                  font-bold text-xs w-8 h-6 rounded-full flex items-center justify-center text-white shadow-md
                  ${idx === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
                    idx === 1 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 
                    idx === 2 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 
                    'bg-gradient-to-r from-gray-400 to-gray-500'}
                `}>
                  {idx + 1}위
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
            </button>
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
    </div>
  );
}; 