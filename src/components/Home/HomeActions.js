// 🎯 홈 컴포넌트 이벤트 핸들러
// 원본: Home/index.js에서 추출

import { useAuth } from '../../contexts/AuthContext';
import { useVideoPlayer } from '../../contexts/VideoPlayerContext';
import { useToast } from '../common/Toast';
import { useWatchedVideos } from '../../contexts/WatchedVideosContext';

export const useHomeActions = () => {
  const { currentUser } = useAuth();
  const { initializePlayer } = useVideoPlayer();
  const { showToast } = useToast();
  const { setCertified } = useWatchedVideos();

  // 시청 완료 처리 함수
  const handleWatchComplete = (videoId) => {
    console.log('✅ [HomeActions] 시청 완료 처리:', videoId);
    
    // localStorage에 시청 완료 상태 저장
    localStorage.setItem(`watched_${videoId}`, 'true');
    
    // Firestore에 시청 완료 저장
    setCertified(videoId, true, 'manual');
    
    showToast('✅ 시청 완료로 처리되었습니다!', 'success');
    
    // 페이지 새로고침 대신 React 상태로 업데이트
    // setTimeout(() => {
    //   window.location.reload();
    // }, 1000);
  };

  // 시청 상태 확인 함수
  const isWatched = (videoId) => {
    // localStorage에서 시청 완료 상태 확인만 사용
    return localStorage.getItem(`watched_${videoId}`) === 'true';
  };

  // 채널 삭제 시 모든 상태 초기화
  const handleChannelDeleteWithReset = async (
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
  ) => {
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
      
      // 5. 탭/필터 상태 초기화
      setActiveTab('watch');
      setVideoFilter('all');
      
      // 6. 로딩/에러 상태 초기화
      setLoading(false);
      setError(null);
      
      // 7. 글로벌 비디오플레이어 초기화
      setSelectedVideoId(null);
      resetPlayerState();
      
      // 8. localStorage 관련 데이터 초기화 (필요시)
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
      
      // 9. 스크롤 위치 맨 위로 초기화
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      console.log('✅ 전체 상태 초기화 완료');
      showToast('🔄 모든 설정이 초기화되었습니다.\n처음부터 다시 시작해주세요!', 'success');
      
    } catch (error) {
      console.error('❌ 초기화 중 오류:', error);
      showToast('❌ 초기화 중 오류가 발생했습니다.', 'error');
    }
  };

  // 영상 선택 완료 핸들러
  const handleVideoSelectionComplete = (
    selectedVideos,
    setVideoSelectionDone,
    setVideoSelectionCollapsed,
    setShowLoginStep,
    setPendingVideoSave,
    hookHandleVideoSelectionComplete
  ) => {
    console.log('🎯 영상 선택 완료 핸들러 호출됨:', {
      selectedVideosCount: selectedVideos?.length || 0,
      selectedVideos,
      currentUser: !!currentUser
    });
    
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

  // 시청하기 버튼 클릭 시 처리 (YouTube 팝업창 열기 + 시청 완료 버튼으로 변경)
  const handleWatchClick = (video, idx, videos) => {
    console.log('🎬 시청하기 버튼 클릭됨!', video);
    
    // 영상 ID 추출
    const videoId = video.videoId || video.id || video.youtubeId;
    console.log('🔍 추출된 videoId:', videoId);
    
    if (!videoId) {
      console.error('영상 ID를 찾을 수 없습니다:', video);
      showToast('❌ 영상 정보가 올바르지 않습니다.', 'error');
      return;
    }
    
    // 이미 시청 완료된 영상인지 확인
    if (isWatched(videoId)) {
      console.log('✅ 이미 시청 완료된 영상');
      showToast('✅ 이미 시청 완료된 영상입니다.', 'info');
      return;
    }
    
    // YouTube URL 생성
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('🚀 YouTube URL 생성:', youtubeUrl);
    
    // 모바일 환경 감지
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // 모바일에서는 작은 팝업창으로 열기
      console.log('📱 모바일 환경 감지 - 작은 팝업창으로 열기');
      const popup = window.open(youtubeUrl, 'youtube_mobile', 'width=400,height=300,scrollbars=yes,resizable=yes');
      
      if (popup) {
        console.log('✅ 모바일에서 작은 팝업창 열기 성공');
        showToast('📺 YouTube에서 영상을 시청하세요! 시청 완료 후 "시청완료(수동)" 버튼을 눌러주세요.', 'success');
      } else {
        console.warn('⚠️ 모바일에서 팝업창 열기 실패');
        showToast('⚠️ 팝업창이 차단되었습니다. 수동으로 YouTube에 접속해주세요.', 'warning');
      }
    } else {
      // 데스크톱에서는 팝업창으로 열기
      console.log('🖥️ 데스크톱 환경 - 팝업창으로 열기');
      const popup = window.open(youtubeUrl, 'youtube_view', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (popup) {
        console.log('✅ 데스크톱에서 팝업창 열기 성공');
        showToast('📺 YouTube에서 영상을 시청하세요! 시청 완료 후 "시청완료(수동)" 버튼을 눌러주세요.', 'success');
      } else {
        console.warn('⚠️ 데스크톱에서 팝업창 열기 실패');
        showToast('⚠️ 팝업창이 차단되었습니다. 수동으로 YouTube에 접속해주세요.', 'warning');
      }
    }
  };

  // 메시지 클릭 핸들러
  const handleMessageClick = (viewer) => {
    console.log('Message clicked:', viewer);
    // TODO: 메시지 전송 처리
  };

  return {
    handleChannelDeleteWithReset,
    handleVideoSelectionComplete,
    handleVideoClick,
    handleWatchClick,
    handleMessageClick,
    handleWatchComplete,
    isWatched,
  };
}; 