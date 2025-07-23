// 🛠️ 홈 컴포넌트 유틸리티 및 상수
// 원본: Home/index.js에서 추출

// 목업 시청자 데이터
export const MOCK_VIEWERS = [
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

// 애니메이션 설정
export const stepVariants = {
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

// 초기 상태 점검 유틸리티
export const checkInitialState = (
  hasCheckedInitialState,
  channelRegistered,
  selectedCategories,
  categoryStepDone,
  videoSelectionDone,
  setCategoryStepDone,
  setCategoryCollapsed
) => {
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
};

// 로그인 성공 후 처리 유틸리티
export const handleLoginSuccess = (
  showLoginStep,
  currentUser,
  pendingVideoSave,
  selectedVideos,
  hookHandleVideoSelectionComplete,
  setVideoSelectionDone,
  setVideoSelectionCollapsed,
  setShowLoginStep,
  setPendingVideoSave
) => {
  if (showLoginStep && currentUser && pendingVideoSave && selectedVideos.length > 0) {
    // Firestore 저장 로직 (완료 상태로 저장)
    hookHandleVideoSelectionComplete(selectedVideos);
    setVideoSelectionDone(true);
    setVideoSelectionCollapsed(true);
    setShowLoginStep(false);
    setPendingVideoSave(false);
  }
};

// Firestore 완료 상태 동기화 유틸리티
export const syncFirestoreCompletionState = (
  isVideoSelectionCompleted,
  selectedVideos,
  videoSelectionDone,
  setVideoSelectionDone,
  setVideoSelectionCollapsed
) => {
  if (isVideoSelectionCompleted && selectedVideos && selectedVideos.length > 0 && !videoSelectionDone) {
    console.log('🔧 Firestore에서 영상 선택 완료 상태 복원:', selectedVideos.length);
    setVideoSelectionDone(true);
    setVideoSelectionCollapsed(true);
  }
}; 