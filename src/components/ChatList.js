import React from 'react';
import { useNavigate } from "react-router-dom";
import SearchFilter from './ChatList/components/SearchFilter';
import RoomCard from './ChatList/components/RoomCard';

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
    handleEnterRoom,

    // 계산된 값
    myRooms,
    joinedRooms,
  } = useChatList();

  const { loading } = useAuth();

  if (loading || roomsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-[#f7faff] rounded-2xl p-3 min-h-screen flex flex-col">
      {/* 헤더 - 제목과 버튼들 */}
      <div className="flex items-center justify-between mt-4 mb-4">
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

      {/* 내 채팅방 리스트 - 내가 만든 방과 참여중인 방을 통합하여 최신 메시지 순으로 표시 */}
      <div className="flex flex-col gap-3 mb-safe">
        {/* 방 개수 표시 */}
        <div className="text-sm text-gray-500 mb-2">
          내 채팅방: {[...myRooms, ...joinedRooms].length}개
        </div>

        {/* 통합된 내 채팅방 목록 */}
        <div className="space-y-3">
          {[...myRooms, ...joinedRooms]
            .sort((a, b) => b.sortTimestamp - a.sortTimestamp) // 최신 메시지 순으로 정렬
            .map(room => (
            <div key={room.id} className="relative">
              <RoomCard 
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
          
          {/* 채팅방이 없을 때 */}
          {[...myRooms, ...joinedRooms].length === 0 && (
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