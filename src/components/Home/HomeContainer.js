// 🏠 홈 컴포넌트 컨테이너 (상태 관리 및 메인 로직)
// 원본: Home/index.js에서 추출

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVideoPlayer } from '../../contexts/VideoPlayerContext';
import { useWatchedVideos } from '../../contexts/WatchedVideosContext';
import { LoadingSpinner, ErrorDisplay } from './components/LoadingError';
import { useHomeChannelState } from './hooks/useHomeChannelState';
import { useHomeCategoryState } from './hooks/useHomeCategoryState';
import { useHomeVideoSelectionState } from './hooks/useHomeVideoSelectionState';
import { useHomeTabState } from './hooks/useHomeTabState';
import { useUcraVideos } from './hooks/useUcraVideos';
import { useToast } from '../common/Toast';
import GlobalVideoPlayer from '../GlobalVideoPlayer';
import { HomeSteps } from './HomeSteps';
import { useHomeActions } from './HomeActions';
import { WatchRateSummary } from './components/WatchRateSummary';
import { 
  MOCK_VIEWERS, 
  checkInitialState, 
  handleLoginSuccess, 
  syncFirestoreCompletionState 
} from './HomeUtils';

export const HomeContainer = () => {
  const { currentUser } = useAuth();
  const {
    resetPlayerState,
    setSelectedVideoId,
    initializePlayer
  } = useVideoPlayer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Toast 시스템
  const { showToast, ToastContainer } = useToast();
  
  // 시청된 영상 관리 (WatchedVideosContext에서 통합 관리)
  const { getWatchInfo } = useWatchedVideos();
  
  // 유크라 영상 및 시청률 데이터
  const { totalVideos, watchedVideosCount, watchRate } = useUcraVideos();
  
  // 채널 등록 상태 (custom hook)
  const {
    channelRegistered,
    setChannelRegistered,
    channelInfo,
    setChannelInfo,
    handleChannelRegister,
    handleChannelDelete,
  } = useHomeChannelState();
  
  // 카테고리 상태 (custom hook)
  const {
    selectedCategories,
    setSelectedCategories,
    handleCategoriesChange,
  } = useHomeCategoryState();
  
  // 영상 선택 상태 (custom hook)
  const {
    selectedVideos,
    setSelectedVideos,
    handleVideoSelection,
    handleVideoSelectionComplete: hookHandleVideoSelectionComplete,
    isVideoSelectionCompleted,
    resetVideoSelectionState,
  } = useHomeVideoSelectionState();
  
  // 탭/필터 상태 (custom hook)
  const {
    activeTab,
    setActiveTab,
    videoFilter,
    setVideoFilter,
  } = useHomeTabState();

  // 단계별 상태 관리
  const [categoryStepDone, setCategoryStepDone] = useState(false);
  const [categoryCollapsed, setCategoryCollapsed] = useState(false);
  const [videoSelectionDone, setVideoSelectionDone] = useState(false);
  const [videoSelectionCollapsed, setVideoSelectionCollapsed] = useState(false);
  const [loginStepDone, setLoginStepDone] = useState(false);
  const [showLoginStep, setShowLoginStep] = useState(false);
  const [pendingVideoSave, setPendingVideoSave] = useState(false);

  // 이벤트 핸들러
  const {
    handleChannelDeleteWithReset: actionsHandleChannelDeleteWithReset,
    handleVideoSelectionComplete: actionsHandleVideoSelectionComplete,
    handleVideoClick,
    handleWatchClick,
    handleMessageClick,
    handleWatchComplete,
  } = useHomeActions();

  // 로그인 상태 체크
  useEffect(() => {
    if (currentUser) {
      setLoginStepDone(true);
    } else {
      setLoginStepDone(false);
    }
  }, [currentUser]);

  // 기존 데이터가 있으면 단계별로 순차 완료 처리
  useEffect(() => {
    // 1-2단계: 채널 등록 + 카테고리 설정이 모두 완료된 경우
    if (channelRegistered && selectedCategories && selectedCategories.length > 0) {
      setCategoryStepDone(true);
      setCategoryCollapsed(true);
    }
  }, [channelRegistered, selectedCategories]);

  // 컴포넌트 마운트 후 상태 점검 (데이터 로드 완료 시)
  const hasCheckedInitialState = useRef(false);
  
  // 초기 로드 시에만 상태 점검 (selectedVideos 제외)
  useEffect(() => {
    checkInitialState(
      hasCheckedInitialState,
      channelRegistered,
      selectedCategories,
      categoryStepDone,
      videoSelectionDone,
      setCategoryStepDone,
      setCategoryCollapsed
    );
  }, [channelRegistered, selectedCategories, categoryStepDone, videoSelectionDone]);

  // Firestore에서 불러온 완료 상태로 UI 상태 동기화
  useEffect(() => {
    syncFirestoreCompletionState(
      isVideoSelectionCompleted,
      selectedVideos,
      videoSelectionDone,
      setVideoSelectionDone,
      setVideoSelectionCollapsed
    );
  }, [isVideoSelectionCompleted, selectedVideos, videoSelectionDone]);

  // 로그인 성공 후 Firestore 저장 및 다음 단계
  useEffect(() => {
    handleLoginSuccess(
      showLoginStep,
      currentUser,
      pendingVideoSave,
      selectedVideos,
      hookHandleVideoSelectionComplete,
      setVideoSelectionDone,
      setVideoSelectionCollapsed,
      setShowLoginStep,
      setPendingVideoSave
    );
  }, [showLoginStep, currentUser, pendingVideoSave, selectedVideos, hookHandleVideoSelectionComplete]);

  // 채널 삭제 핸들러 래핑
  const handleChannelDeleteWithReset = async () => {
    await actionsHandleChannelDeleteWithReset(
      handleChannelDelete,
      setSelectedCategories,
      setCategoryStepDone,
      setCategoryCollapsed,
      setVideoSelectionDone,
      setVideoSelectionCollapsed,
      resetVideoSelectionState,
      setLoginStepDone,
      setShowLoginStep,
      setPendingVideoSave,
      setActiveTab,
      setVideoFilter,
      setLoading,
      setError,
      setSelectedVideoId,
      resetPlayerState
    );
  };

  // 영상 선택 완료 핸들러 래핑
  const handleVideoSelectionComplete = (selectedVideos) => {
    actionsHandleVideoSelectionComplete(
      selectedVideos,
      setVideoSelectionDone,
      setVideoSelectionCollapsed,
      setShowLoginStep,
      setPendingVideoSave,
      hookHandleVideoSelectionComplete
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <>
      <HomeSteps
        // 상태
        channelRegistered={channelRegistered}
        categoryStepDone={categoryStepDone}
        categoryCollapsed={categoryCollapsed}
        videoSelectionDone={videoSelectionDone}
        videoSelectionCollapsed={videoSelectionCollapsed}
        showLoginStep={showLoginStep}
        currentUser={currentUser}
        
        // 핸들러
        handleChannelRegister={handleChannelRegister}
        handleChannelDeleteWithReset={handleChannelDeleteWithReset}
        handleCategoriesChange={handleCategoriesChange}
        handleVideoSelection={handleVideoSelection}
        handleVideoSelectionComplete={handleVideoSelectionComplete}
        handleVideoClick={handleVideoClick}
        handleWatchClick={handleWatchClick}
        handleMessageClick={handleMessageClick}
        
        // 데이터
        channelInfo={channelInfo}
        selectedCategories={selectedCategories}
        selectedVideos={selectedVideos}
        activeTab={activeTab}
        videoFilter={videoFilter}
        setActiveTab={setActiveTab}
        setVideoFilter={setVideoFilter}
        getWatchCount={getWatchInfo}
        MOCK_VIEWERS={MOCK_VIEWERS}
        
        // 시청률 데이터
        totalVideos={totalVideos}
        watchedVideosCount={watchedVideosCount}
        watchRate={watchRate}
        
        // 접기/펼치기 핸들러
        setCategoryCollapsed={setCategoryCollapsed}
        setVideoSelectionCollapsed={setVideoSelectionCollapsed}
        
        // 시청 완료 핸들러
        onWatchComplete={handleWatchComplete}
      />
      
      {/* Toast 알림 컨테이너 */}
      <ToastContainer />
      
      {/* 글로벌 비디오 플레이어 */}
      <GlobalVideoPlayer />
    </>
  );
}; 