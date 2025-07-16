import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useVideoPlayer } from '../../contexts/VideoPlayerContext';
import { useWatchedVideos } from '../../contexts/WatchedVideosContext';
import { HomeHeader } from './components/HomeHeader';
import { ChannelRegisterCard } from './components/ChannelRegisterCard';
import { CategoryInputBox } from './components/CategoryInputBox';
import { MyVideoListWithSelection } from './components/MyVideoListWithSelection';
import { LoginStep } from './components/LoginStep';

import { WatchTabsContainer } from './components/WatchTabsContainer';
import { LoadingSpinner, ErrorDisplay } from './components/LoadingError';
import { useHomeChannelState } from './hooks/useHomeChannelState';
import { useHomeCategoryState } from './hooks/useHomeCategoryState';
import { useHomeVideoSelectionState } from './hooks/useHomeVideoSelectionState';
// import { useVideoWatchCount } from './hooks/useVideoWatchCount'; // WatchedVideosContext로 통합

import { useHomeTabState } from './hooks/useHomeTabState';
import { useToast } from '../common/Toast';
import { fetchChannelVideos } from '../../services/videoService';
import GlobalVideoPlayer from '../GlobalVideoPlayer';

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
  const { handleVideoSelect, resetPlayerState, setSelectedVideoId } = useVideoPlayer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Toast 시스템
  const { showToast, ToastContainer } = useToast();
  
  // 시청된 영상 관리 (WatchedVideosContext에서 통합 관리)
  const { getWatchInfo, incrementWatchCount } = useWatchedVideos();
  
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
  
  // 토큰 기능 제거됨
  
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
  // 토큰 기능 제거됨
  const [showLoginStep, setShowLoginStep] = useState(false);
  const [pendingVideoSave, setPendingVideoSave] = useState(false);


  


  // 로그인 상태 체크
  useEffect(() => {
    if (currentUser) {
      setLoginStepDone(true);
    } else {
      setLoginStepDone(false);
    }
    // 영상 로딩은 별도 useEffect에서 처리 (중복 호출 방지)
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
    // 아직 점검하지 않았고, 기본 상태가 로드되었을 때만 실행
    if (!hasCheckedInitialState.current && channelRegistered !== undefined && selectedCategories !== undefined) {
      console.log('🔍 초기 상태 점검 시작:', {
        channelRegistered,
        categoriesCount: selectedCategories?.length || 0,
        categoryStepDone,
        videoSelectionDone
      });
      
      let hasUpdates = false;
      
      // 1. 채널+카테고리가 있는데 categoryStepDone이 false인 경우
      if (channelRegistered && selectedCategories?.length > 0 && !categoryStepDone) {
        console.log('🔧 카테고리 단계 상태 수정');
        setCategoryStepDone(true);
        setCategoryCollapsed(true);
        hasUpdates = true;
      }
      
      hasCheckedInitialState.current = true;
      
      if (hasUpdates) {
        console.log('✅ 초기 상태 수정 완료');
      } else {
        console.log('👍 모든 초기 상태가 올바름');
      }
    }
  }, [channelRegistered, selectedCategories, categoryStepDone, videoSelectionDone]);

  // Firestore에서 불러온 완료 상태로 UI 상태 동기화
  useEffect(() => {
    if (isVideoSelectionCompleted && selectedVideos && selectedVideos.length > 0 && !videoSelectionDone) {
      console.log('🔧 Firestore에서 영상 선택 완료 상태 복원:', selectedVideos.length);
      setVideoSelectionDone(true);
      setVideoSelectionCollapsed(true);
    }
  }, [isVideoSelectionCompleted, selectedVideos, videoSelectionDone]);

  // 채널 삭제 시 모든 상태 초기화
  const handleChannelDeleteWithReset = async () => {
    console.log('🔄 채널 삭제 및 전체 초기화 시작...');
    
    try {
      // 1. 채널 정보 삭제
      await handleChannelDelete();
      
      // 2. 카테고리 상태 초기화
      setSelectedCategories([]);
      setCategoryStepDone(false);
      setCategoryCollapsed(false);
      
      // 3. 영상 선택 상태 초기화  
      setVideoSelectionDone(false);
      setVideoSelectionCollapsed(false);
      
      // hook의 초기화 함수로 Firestore도 함께 초기화
      await resetVideoSelectionState();
      
      // 4. 로그인 관련 상태 초기화
      setLoginStepDone(false);
      setShowLoginStep(false);
      setPendingVideoSave(false);
      
      // 5. 토큰 기능 제거됨
      
      // 6. 영상 데이터 초기화
      setWatchVideos([]);
      setVideosLoading(false);
      
      // 7. 탭/필터 상태 초기화
      setActiveTab('watch');
      setVideoFilter('all');
      
      // 8. 로딩/에러 상태 초기화
      setLoading(false);
      setError(null);
      
      // 9. 글로벌 비디오플레이어 초기화
      setSelectedVideoId(null);
      resetPlayerState();
      
      // 10. localStorage 관련 데이터 초기화 (필요시)
      try {
        // 홈 관련 임시 데이터 삭제
        localStorage.removeItem('home_channelInfo');
        localStorage.removeItem('home_selectedCategories');
        localStorage.removeItem('home_selectedVideos');
        localStorage.removeItem('home_stepProgress');
        localStorage.removeItem('video_selection_completed');
        console.log('📱 localStorage 데이터 정리 완료');
      } catch (e) {
        console.warn('⚠️ localStorage 정리 중 경고:', e);
      }
      
      // 11. 스크롤 위치 맨 위로 초기화
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      console.log('✅ 전체 상태 초기화 완료');
      showToast('🔄 모든 설정이 초기화되었습니다.\n처음부터 다시 시작해주세요!', 'success');
      
    } catch (error) {
      console.error('❌ 초기화 중 오류:', error);
      showToast('error', '❌ 초기화 중 오류가 발생했습니다.');
    }
  };

  // 영상 선택 완료 핸들러
  const handleVideoSelectionComplete = (selectedVideos) => {
    console.log('🎯 영상 선택 완료:', selectedVideos);
    
    // 영상 선택이 완료되었으므로 항상 카드 접기
    setVideoSelectionDone(true);
    setVideoSelectionCollapsed(true);
    
    if (!currentUser) {
      console.log('🔐 로그인 필요 - 로그인 단계 표시');
      setShowLoginStep(true);
      setPendingVideoSave(true);
      return;
    }
    
    // 로그인된 상태라면 hook의 완료 함수로 Firestore 저장
    console.log('💾 로그인된 상태 - Firestore 저장 로직 실행');
    hookHandleVideoSelectionComplete(selectedVideos);
  };

  // 로그인 성공 후 Firestore 저장 및 다음 단계
  useEffect(() => {
    if (showLoginStep && currentUser && pendingVideoSave && selectedVideos.length > 0) {
      // Firestore 저장 로직 (완료 상태로 저장)
      hookHandleVideoSelectionComplete(selectedVideos);
      setVideoSelectionDone(true);
      setVideoSelectionCollapsed(true);
      setShowLoginStep(false);
      setPendingVideoSave(false);
    }
  }, [showLoginStep, currentUser, pendingVideoSave, selectedVideos, hookHandleVideoSelectionComplete]);

  // 영상 클릭 시 YouTube 새창 열기
  const handleVideoClick = (video) => {
    console.log('Video clicked:', video);
    const videoId = video.videoId || video.id || video.youtubeId;
    if (videoId) {
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log('YouTube URL 생성:', youtubeUrl);
      window.open(youtubeUrl, '_blank');
    } else {
      console.error('영상 ID를 찾을 수 없습니다:', video);
      // 영상 제목으로 YouTube 검색 페이지 열기 (fallback)
      if (video.title) {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(video.title)}`;
        console.log('YouTube 검색 URL 생성:', searchUrl);
        window.open(searchUrl, '_blank');
      }
    }
  };

  // 시청하기 버튼 클릭 시 처리 (글로벌 플레이어 열기)
  const handleWatchClick = (video) => {
    console.log('🎬 시청하기 버튼 클릭됨!', video);
    
    // 영상 ID 추출
    const videoId = video.videoId || video.id || video.youtubeId;
    console.log('🔍 추출된 videoId:', videoId);
    
    if (!videoId) {
      console.error('영상 ID를 찾을 수 없습니다:', video);
      showToast('error', '❌ 영상 정보가 올바르지 않습니다.');
      return;
    }
    
    // 글로벌 플레이어로 영상 선택 (팝업 플레이어 열기)
    console.log('📺 handleVideoSelect 호출 중...', videoId);
    handleVideoSelect(videoId);
    
    console.log('✅ GlobalVideoPlayer 호출 완료');
  };



  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  const handleMessageClick = (viewer) => {
    console.log('Message clicked:', viewer);
    // TODO: 메시지 전송 처리
  };

  // 현재 진행 단계 계산
  const getCurrentStep = () => {
    if (!channelRegistered) return 1;
    if (!categoryStepDone) return 2;
    if (!videoSelectionDone) return 3;
    if (!currentUser) return 4;
    return 5; // 영상 시청 단계 (바로 5단계로)
  };

  const currentStep = getCurrentStep();
  const totalSteps = 5;

  // 디버깅: 현재 상태 확인
  console.log('Home 컴포넌트 상태:', {
    channelRegistered,
    categoryStepDone,
    videoSelectionDone,
    currentUser: !!currentUser,
    loginStepDone,
    currentStep,
    selectedVideos: selectedVideos?.length || 0
  });

  // 단계 헤더 컴포넌트
  const StepHeader = ({ stepNumber, title, isActive, isCompleted }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: stepNumber * 0.1 }}
      className={`flex items-center gap-3 mb-4 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}
    >
      <motion.div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isActive 
            ? 'bg-blue-500 text-white shadow-lg' 
            : isCompleted 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-200 text-gray-500'
        }`}
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
      >
        {isCompleted ? '✓' : stepNumber}
      </motion.div>
      <span className="font-medium">{title}</span>
      {isActive && (
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );

  // 애니메이션 설정
  const stepVariants = {
    hidden: { 
      opacity: 0, 
      y: 30, 
      scale: 0.95 
    },
    visible: (delay) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: delay * 0.2,
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }),
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.3
      }
    }
  };

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
        
        {/* 2단계: 카테고리 등록 - 제목 없이 */}
        <AnimatePresence mode="wait">
        {channelRegistered && (
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
            onComplete={() => { setCategoryStepDone(true); setCategoryCollapsed(true); }}
            collapsed={categoryCollapsed}
            onExpand={() => setCategoryCollapsed(false)}
            onCollapse={() => setCategoryCollapsed(true)}
          />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 토큰 기능 제거됨 */}

        {/* 3단계: 노출 영상 선택 - 제목 없이 */}
        <AnimatePresence mode="wait">
        {categoryStepDone && (
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
              selectedVideos={selectedVideos}
              onVideosChange={handleVideoSelection}
                onComplete={() => handleVideoSelectionComplete(selectedVideos)}
                collapsed={videoSelectionCollapsed}
                onExpand={() => setVideoSelectionCollapsed(false)}
                currentUser={currentUser}
                onRequireLogin={() => setShowLoginStep(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 4단계: 로그인 - 영상 선택 완료 후 로그인 필요 시 표시 */}
        <AnimatePresence mode="wait">
          {(showLoginStep || (videoSelectionDone && !currentUser)) && (
            <motion.div
              key="login-step"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={3}
            >
              <LoginStep onComplete={() => {
                setShowLoginStep(false);
                setLoginStepDone(true);
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      
        {/* 5단계: 영상 시청하기 - 제목 없이 */}
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
                  getWatchCount={getWatchInfo}
                />
              </div>
            </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Toast 알림 컨테이너 */}
      <ToastContainer />
      

      
      {/* 글로벌 비디오 플레이어 */}
      <GlobalVideoPlayer />
    </div>
  );
}

export default Home; 