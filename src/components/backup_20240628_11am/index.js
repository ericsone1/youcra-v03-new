import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { HomeHeader } from './components/HomeHeader';
import { ChannelRegisterCard } from './components/ChannelRegisterCard';
import { CategoryInputBox } from './components/CategoryInputBox';
import { MyVideoListWithSelection } from './components/MyVideoListWithSelection';
import { ExposureTokenInfo } from './components/ExposureTokenInfo';
import { WatchTabsContainer } from './components/WatchTabsContainer';
import { LoadingSpinner, ErrorDisplay } from './components/LoadingError';
import { LoginPromptCard } from './components/LoginPromptCard';

function Home() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 채널 등록 상태
  const [channelRegistered, setChannelRegistered] = useState(false);
  const [channelInfo, setChannelInfo] = useState(null);
  
  // 카테고리 상태
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoriesCompleted, setCategoriesCompleted] = useState(false);
  
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

  const handleCategoriesComplete = () => {
    setCategoriesCompleted(true);
    console.log('카테고리 선택 완료');
  };

  const handleVideoSelection = (videos) => {
    setSelectedVideos(videos);
    // TODO: API 호출 및 상태 업데이트
  };

  return (
    <div className="min-h-screen overflow-y-auto hide-scrollbar pb-20">
      <div className="max-w-2xl mx-auto p-2 space-y-6">
        <HomeHeader />
        
        {/* 채널 등록 카드 */}
        <ChannelRegisterCard
          onRegister={handleChannelRegister}
          channelInfo={channelInfo}
          onEdit={() => {
            if (window.confirm('채널을 수정하시겠습니까? 현재 설정이 초기화됩니다.')) {
              setChannelRegistered(false);
              setChannelInfo(null);
              setCategoriesCompleted(false);
              setSelectedCategories([]);
              setSelectedVideos([]);
            }
          }}
          onDelete={() => {
            if (window.confirm('채널을 삭제하시겠습니까? 모든 설정이 초기화됩니다.')) {
              setChannelRegistered(false);
              setChannelInfo(null);
              setCategoriesCompleted(false);
              setSelectedCategories([]);
              setSelectedVideos([]);
              setTokenCount(0);
            }
          }}
        />
        
        {/* 카테고리 입력 */}
        {channelRegistered && (
          <CategoryInputBox
            selectedCategories={selectedCategories}
            onCategoriesChange={handleCategoriesChange}
            onComplete={handleCategoriesComplete}
            completed={categoriesCompleted}
          />
        )}
        
        {/* 내 채널 영상 리스트 */}
        {channelRegistered && categoriesCompleted && (
          <MyVideoListWithSelection
            channelInfo={channelInfo}
            selectedVideos={selectedVideos}
            onVideosChange={handleVideoSelection}
          />
        )}
        
        {/* 노출수 토큰 정보 */}
        {selectedVideos.length > 0 && (
          <ExposureTokenInfo tokenCount={tokenCount} />
        )}
        
        {/* 시청 기능 영역 또는 로그인 프롬프트 */}
        {selectedVideos.length > 0 && (
          currentUser && !currentUser.isTemporaryUser ? (
            <WatchTabsContainer
              activeTab={activeTab}
              onTabChange={setActiveTab}
              videoFilter={videoFilter}
              onFilterChange={setVideoFilter}
              selectedVideos={selectedVideos}
              onTokenEarned={() => setTokenCount(prev => prev + 1)}
            />
          ) : (
            <LoginPromptCard />
          )
        )}
      </div>
    </div>
  );
}

export default Home; 