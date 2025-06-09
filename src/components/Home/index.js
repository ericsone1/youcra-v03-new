import React from 'react';
import Header from './Header';
import PopularChatRooms from './PopularChatRooms';
import YouTubeSection from './YouTubeSection';
import { useYouTube } from './hooks/useYouTube';
import { useChatRoomsHome } from './hooks/useChatRoomsHome';

function Home() {
  // YouTube 관련 데이터와 로직
  const {
    videos,
    loading: youtubeLoading,
    error: youtubeError,
    selectedVideoId,
    visibleCount,
    setVisibleCount,
    filteredVideos,
    handleVideoSelect
  } = useYouTube();

  // 채팅방 관련 데이터와 로직
  const {
    chatRooms,
    loadingRooms,
    searchQuery,
    setSearchQuery,
    filteredChatRooms,
    visibleRoomsCount,
    setVisibleRoomsCount,
    handleRoomClick,
    handleSearch,
    handleSearchKeyDown
  } = useChatRoomsHome();

  // 로딩 상태
  if (youtubeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="spinner"></div>
          <div className="text-gray-600 font-medium">로딩 중...</div>
        </div>
      </div>
    );
  }
  
  // 에러 상태
  if (youtubeError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">오류 발생</h3>
          <p className="text-red-600 mb-6">{youtubeError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary w-full"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto hide-scrollbar">
      <div className="max-w-2xl mx-auto p-2 space-y-4">
        <Header />
        
        <PopularChatRooms
          chatRooms={chatRooms}
          loadingRooms={loadingRooms}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredChatRooms={filteredChatRooms}
          visibleRoomsCount={visibleRoomsCount}
          setVisibleRoomsCount={setVisibleRoomsCount}
          onRoomClick={handleRoomClick}
          onSearch={handleSearch}
          onSearchKeyDown={handleSearchKeyDown}
        />
        
        <YouTubeSection
          videos={videos}
          filteredVideos={filteredVideos}
          visibleCount={visibleCount}
          setVisibleCount={setVisibleCount}
          selectedVideoId={selectedVideoId}
          onVideoSelect={handleVideoSelect}
        />
      </div>
    </div>
  );
}

export default Home; 