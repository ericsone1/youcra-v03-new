// 🎯 홈 컴포넌트 단계별 UI
// 원본: Home/index.js에서 추출

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeHeader } from './components/HomeHeader';
import { ChannelRegisterCard } from './components/ChannelRegisterCard';
import { CategoryInputBox } from './components/CategoryInputBox';
import { MyVideoListWithSelection } from './components/MyVideoListWithSelection';
import { LoginStep } from './components/LoginStep';
import { WatchTabsContainer } from './components/WatchTabsContainer';
import TokenStatsCard from '../MyChannel/TokenStatsCard';
// import { WatchRateSummary } from './components/WatchRateSummary';
import { stepVariants } from './HomeUtils';

export const HomeSteps = ({
  // 상태
  channelRegistered,
  categoryStepDone,
  categoryCollapsed,
  videoSelectionDone,
  videoSelectionCollapsed,
  showLoginStep,
  currentUser,
  
  // 핸들러
  handleChannelRegister,
  handleChannelDeleteWithReset,
  handleCategoriesChange,
  handleVideoSelection,
  handleVideoSelectionComplete,
  handleVideoClick,
  handleWatchClick,
  handleMessageClick,
  
  // 데이터
  channelInfo,
  selectedCategories,
  selectedVideos,
  activeTab,
  videoFilter,
  setActiveTab,
  setVideoFilter,
  getWatchCount,
  MOCK_VIEWERS,
  
  // 시청률 데이터
  totalVideos,
  watchedVideosCount,
  watchRate,
  
  // 카테고리 접기/펼치기 핸들러
  setCategoryCollapsed,
  setVideoSelectionCollapsed,
  
  // 시청 완료 핸들러
  onWatchComplete = () => {}
}) => {
  return (
    <div className="min-h-screen overflow-y-auto hide-scrollbar pb-40 pt-4">
      <div className="max-w-2xl mx-auto p-2 space-y-6">
        <HomeHeader />
        
        {/* 1단계: 채널 등록 - 제목 없이 */}
        <motion.div
          variants={stepVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <ChannelRegisterCard
            onRegister={handleChannelRegister}
            channelInfo={channelInfo}
            onDelete={handleChannelDeleteWithReset}
          />
        </motion.div>
        
        {/* 2단계: 카테고리 선택 - 채널 등록 완료 후 표시 */}
        {channelRegistered && (
          <AnimatePresence mode="wait">
            <motion.div
              key="category-step"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={1}
            >
              
              <CategoryInputBox
                selectedCategories={selectedCategories}
                onCategoriesChange={handleCategoriesChange}
                onStepComplete={() => setCategoryCollapsed(true)}
                collapsed={categoryCollapsed}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* 3단계: 노출 영상 선택 - 제목 없이 */}
        {categoryStepDone && (
          <AnimatePresence mode="wait">
            <motion.div
              key="video-selection-step"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={2}
            >
              <MyVideoListWithSelection
                channelInfo={channelInfo}
                selectedCategories={selectedCategories}
                selectedVideos={selectedVideos}
                onVideosChange={handleVideoSelection}
                onComplete={handleVideoSelectionComplete}
                collapsed={videoSelectionCollapsed}
                onExpand={() => setVideoSelectionCollapsed(false)}
                onCollapse={() => setVideoSelectionCollapsed(true)}
              />
              
              {/* 토큰 카드 - 영상 선택 완료 후 표시 */}
              {videoSelectionDone && currentUser && (
                <div className="mt-4">
                  <TokenStatsCard />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* 4단계: 로그인 - 영상 선택 완료 후 로그인 필요 시 표시 */}
        <AnimatePresence mode="wait">
          {(() => {
            const shouldShowLogin = showLoginStep || (videoSelectionDone && !currentUser);
            console.log('🔐 로그인 단계 표시 조건 확인:', {
              showLoginStep,
              videoSelectionDone,
              currentUser: !!currentUser,
              shouldShowLogin
            });
            return shouldShowLogin;
          })() && (
            <motion.div
              key="login-step"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={3}
            >
              <LoginStep onComplete={() => {
                // 이 함수는 LoginStep 내부에서 처리됨
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      
        {/* 5단계: 영상 시청하기 - 제목 없이 (로그인 완료 후에만 표시) */}
        {categoryStepDone && videoSelectionDone && currentUser && (
          <AnimatePresence mode="wait">
            <motion.div
              key="watch-step"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={4}
            >
              <div className="space-y-4">
                {/* 시청할 영상 리스트 */}
                {/* <WatchRateSummary
                  totalVideos={totalVideos}
                  watchedVideosCount={watchedVideosCount}
                  watchRate={watchRate}
                /> */}
                <WatchTabsContainer
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  videoFilter={videoFilter}
                  onFilterChange={setVideoFilter}
                  selectedVideos={selectedVideos}
                  viewers={MOCK_VIEWERS}
                  onVideoClick={handleVideoClick}
                  onWatchClick={handleWatchClick}
                  onMessageClick={handleMessageClick}
                  getWatchCount={getWatchCount}
                  onWatchComplete={onWatchComplete}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}; 