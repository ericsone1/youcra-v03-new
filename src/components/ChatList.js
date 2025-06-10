import React from 'react';
import { useNavigate } from "react-router-dom";
import TabHeader from './ChatList/components/TabHeader';
import SearchFilter from './ChatList/components/SearchFilter';
import RoomCard from './ChatList/components/RoomCard';
import RoomSection from './ChatList/components/RoomSection';
import CreateRoomModal from './ChatList/components/CreateRoomModal';
import { useChatList } from './ChatList/hooks/useChatList';

function ChatList() {
  const navigate = useNavigate();
  const {
    // 상태
    rooms,
    searchInput,
    setSearchInput,
    searchActive,
    filter,
    setFilter,
    activeTab,
    setActiveTab,
    showCreateModal,
    setShowCreateModal,
    newRoomName,
    setNewRoomName,
    newRoomHashtags,
    setNewRoomHashtags,
    creating,
    visibleCount,
    setVisibleCount,
    myRoomsVisibleCount,
    setMyRoomsVisibleCount,
    joinedRoomsVisibleCount,
    setJoinedRoomsVisibleCount,

    // 핸들러
    handleCreateRoom,
    handleSearch,
    handleClearSearch,
    handleEnterRoom,
    parseHashtags,

    // 계산된 값
    filteredRooms,
    myRooms,
    joinedRooms,
  } = useChatList();

  return (
    <div className="max-w-md mx-auto bg-[#f7faff] rounded-2xl p-3 min-h-screen flex flex-col">
      <h2 className="text-2xl font-bold text-center mt-4 mb-2">채팅방 리스트</h2>
      
      <TabHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <SearchFilter
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        searchActive={searchActive}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* 방 개수 표시 */}
      <div className="text-sm text-gray-500 mb-2">방 개수: {rooms.length}</div>

      {/* 채팅방 리스트 */}
      <div className="flex flex-col gap-3 mb-safe">
        {activeTab === "전체" ? (
          // 전체 탭
          <div className="space-y-3">
            {filteredRooms.slice(0, visibleCount).map(room => (
              <RoomCard 
                key={room.id} 
                room={room} 
                onEnter={handleEnterRoom} 
              />
            ))}
            
            {/* 전체 탭 더보기 버튼 */}
            {filteredRooms.length > visibleCount && (
              <div className="text-center mt-2">
                <button
                  className="px-6 py-2 bg-blue-100 text-blue-700 rounded-full font-bold hover:bg-blue-200 transition"
                  onClick={() => setVisibleCount(c => c + 5)}
                >
                  더보기
                </button>
              </div>
            )}
          </div>
        ) : (
          // 내 채팅방 탭
          <>
            <RoomSection
              title="내가 만든 방"
              rooms={myRooms}
              visibleCount={myRoomsVisibleCount}
              onLoadMore={() => setMyRoomsVisibleCount(c => c + 5)}
              onEnter={handleEnterRoom}
              showCreateButton={true}
              onCreateClick={() => navigate('/chat/create')}
              emptyMessage="내가 만든 방이 없습니다."
            />

            <RoomSection
              title="참여중인 방"
              rooms={joinedRooms}
              visibleCount={joinedRoomsVisibleCount}
              onLoadMore={() => setJoinedRoomsVisibleCount(c => c + 5)}
              onEnter={handleEnterRoom}
              emptyMessage="참여중인 방이 없습니다."
            />
          </>
        )}
      </div>

      {/* 방 생성 모달 */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        newRoomName={newRoomName}
        setNewRoomName={setNewRoomName}
        newRoomHashtags={newRoomHashtags}
        setNewRoomHashtags={setNewRoomHashtags}
        onCreateRoom={handleCreateRoom}
        creating={creating}
        parseHashtags={parseHashtags}
      />
    </div>
  );
}

export default ChatList; 