import React from 'react';
import { useNavigate } from "react-router-dom";
import SearchFilter from './ChatList/components/SearchFilter';
import LazyRoomCard from './ChatList/components/LazyRoomCard';
import { useLazyList } from '../hooks/useIntersectionObserver';

import { useChatList } from './ChatList/hooks/useChatList';
import { useAuth } from "../contexts/AuthContext";

function ChatList() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const {
    // 상태
    rooms,
    roomsLoading,
    searchInput,
    setSearchInput,
    searchActive,
    // 핸들러
    handleSearch,
    handleClearSearch,

    // 계산된 값
    myRooms,
    joinedRooms,
  } = useChatList();

  // 통합된 내 채팅방 목록 (정렬된)
  const allMyRooms = [...myRooms, ...joinedRooms]
    .sort((a, b) => b.sortTimestamp - a.sortTimestamp);

  // 지연 로딩 적용
  const { 
    visibleItems: visibleMyRooms, 
    hasMore, 
    isLoading: lazyLoading, 
    targetRef: loadMoreRef 
  } = useLazyList(allMyRooms, 8, 4);

  // 내 채팅방 페이지에서는 바로 채팅방으로 입장
  const handleEnterRoom = (roomId) => {
    console.log('내 채팅방에서 바로 입장:', roomId, '→ /chat/' + roomId);
    navigate(`/chat/${roomId}`);
  };

  const { loading } = useAuth();

  if (loading || roomsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-[#f7faff] rounded-2xl min-h-screen flex flex-col">
      {/* 고정 헤더 - 제목과 버튼들 */}
      <div className="flex-shrink-0 p-3 pt-7 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">내 채팅방</h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/chat/create')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
              title="방 만들기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium">방 만들기</span>
            </button>
            <button
              onClick={() => navigate('/chats')}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
              title="방 찾기"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">방 찾기</span>
            </button>
          </div>
        </div>

        <SearchFilter
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          searchActive={searchActive}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
        />
      </div>

      {/* 스크롤 가능한 채팅방 리스트 영역 */}
      <div className="flex-1 overflow-y-auto px-3 pb-safe scroll-optimized">
        {/* 방 개수 표시 */}
        <div className="text-sm text-gray-500 mb-2">
          내 채팅방: {allMyRooms.length}개
        </div>

        {/* 통합된 내 채팅방 목록 */}
        <div className="space-y-3 pb-4">
          {visibleMyRooms.map(room => (
            <div key={room.id} className="relative">
              <LazyRoomCard 
                room={{
                  ...room,
                  // 방장 표시를 위한 추가 정보
                  showHostBadge: room.isMine
                }} 
                onEnter={handleEnterRoom} 
              />
              {/* 방장 표시 */}
              {room.isMine && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">
                  방장
                </div>
              )}
            </div>
          ))}
          
          {/* 더 보기 로딩 트리거 */}
          {hasMore && !roomsLoading && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {lazyLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-sm">더 많은 채팅방을 불러오는 중...</span>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  {allMyRooms.length - visibleMyRooms.length}개 더 보기
                </div>
              )}
            </div>
          )}
          
          {/* 채팅방이 없을 때 */}
          {allMyRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">💬</div>
              {!isAuthenticated ? (
                <>
                  <div className="text-gray-700 text-center font-semibold text-base mb-2">
                    로그인이 안되어 있으면 <span className="text-blue-600 font-bold">로그인</span>해서<br/>
                    <span className="text-green-600 font-bold">나에게 맞는 방</span>을 찾거나 개설해보세요!
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-2 mb-4 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition shadow"
                  >
                    로그인 / 회원가입
                  </button>
                </>
              ) : (
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/chat/create')}
                    className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition"
                  >
                    + 방 만들기
                  </button>
                  <button
                    onClick={() => navigate('/chats')}
                    className="px-6 py-2 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition"
                  >
                    🔍 방 찾기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatList; 