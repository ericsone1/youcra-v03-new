import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { HomeHeader } from './components/HomeHeader';
import { ChannelRegisterCard } from './components/ChannelRegisterCard';
import { CategoryInputBox } from './components/CategoryInputBox';
import { MyVideoListWithSelection } from './components/MyVideoListWithSelection';
import { ExposureTokenInfo } from './components/ExposureTokenInfo';
import { WatchTabsContainer } from './components/WatchTabsContainer';
import { LoadingSpinner, ErrorDisplay } from './components/LoadingError';

// 임시 데이터
const MOCK_VIDEOS = [
  {
    id: '1',
    title: '2024년 1월 업데이트 소식',
    thumbnailUrl: 'https://via.placeholder.com/320x180',
    duration: 180, // 초 단위
    views: 1200,
    uploadedAt: '2024-01-15',
    progress: 0
  },
  {
    id: '2',
    title: '새로운 기능 소개 - 실시간 알림',
    thumbnailUrl: 'https://via.placeholder.com/320x180',
    duration: 300,
    views: 800,
    uploadedAt: '2024-01-14',
    progress: 45
  }
];

const MOCK_VIEWERS = [
  {
    id: '1',
    name: '시청자1',
    profileImage: 'https://via.placeholder.com/150',
    watchedVideos: 5
  },
  {
    id: '2',
    name: '시청자2',
    profileImage: 'https://via.placeholder.com/150',
    watchedVideos: 3
  }
];

const MOCK_TOKEN_INFO = {
  total: 100,
  used: 35,
  earned: 15
};

function Home() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 채널 등록 상태
  const [channelRegistered, setChannelRegistered] = useState(false);
  const [channelInfo, setChannelInfo] = useState(null);
  
  // 카테고리 상태
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // 선택된 영상 상태
  const [selectedVideos, setSelectedVideos] = useState([]);
  
  // 토큰 정보
  const [tokenCount, setTokenCount] = useState(0);
  
  // 현재 활성화된 탭
  const [activeTab, setActiveTab] = useState('watch'); // 'watch' | 'viewers'
  const [videoFilter, setVideoFilter] = useState('all'); // 'all' | 'short' | 'long'

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  const handleChannelRegister = (info) => {
    setChannelRegistered(true);
    setChannelInfo(info);
    // TODO: API 호출 및 상태 업데이트
  };

  const handleCategoriesChange = (newCategories) => {
    setSelectedCategories(newCategories);
    // TODO: API 호출 및 상태 업데이트
  };

  const handleVideoSelection = (videos) => {
    setSelectedVideos(videos);
    // TODO: API 호출 및 상태 업데이트
  };

  const handleVideoClick = (video) => {
    console.log('Video clicked:', video);
    // TODO: 비디오 재생 처리
  };

  const handleMessageClick = (viewer) => {
    console.log('Message clicked:', viewer);
    // TODO: 메시지 전송 처리
  };

  return (
    <div className="min-h-screen overflow-y-auto hide-scrollbar pb-20 w-full">
      <div className="w-full md:max-w-2xl mx-auto p-1 md:p-4 space-y-6">
        <HomeHeader />
        
        {/* 채널 등록 카드 */}
        <ChannelRegisterCard
          onRegister={handleChannelRegister}
          channelInfo={channelInfo}
        />
        
        {/* 카테고리 입력 */}
        {channelRegistered && (
          <CategoryInputBox
            selectedCategories={selectedCategories}
            onCategoriesChange={handleCategoriesChange}
          />
        )}
        
        {/* 내 채널 영상 리스트 */}
        {channelRegistered && selectedCategories.length > 0 && (
          <MyVideoListWithSelection
            channelInfo={channelInfo}
            selectedVideos={selectedVideos}
            onVideosChange={handleVideoSelection}
          />
        )}
        
        {/* 노출수 토큰 정보 */}
        <ExposureTokenInfo tokenCount={tokenCount} />
        
        {/* 시청 기능 영역 */}
        <WatchTabsContainer
          activeTab={activeTab}
          onTabChange={setActiveTab}
          videoFilter={videoFilter}
          onFilterChange={setVideoFilter}
          selectedVideos={selectedVideos}
          onTokenEarned={() => setTokenCount(prev => prev + 1)}
          watchVideos={MOCK_VIDEOS}
          viewers={MOCK_VIEWERS}
          onVideoClick={handleVideoClick}
          onMessageClick={handleMessageClick}
        />
      </div>
    </div>
  );
}

export default Home; 