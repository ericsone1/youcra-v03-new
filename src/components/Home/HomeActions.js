// 🎯 홈 컴포넌트 이벤트 핸들러
// 원본: Home/index.js에서 추출

import { useAuth } from '../../contexts/AuthContext';
import { useVideoPlayer } from '../../contexts/VideoPlayerContext';
import { useToast } from '../common/Toast';

export const useHomeActions = () => {
  const { currentUser } = useAuth();
  const { initializePlayer } = useVideoPlayer();
  const { showToast } = useToast();

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

  // 시청하기 버튼 클릭 시 처리 (팝업 플레이어 열기)
  const handleWatchClick = (video, idx, videos) => {
    console.log('🎬 시청하기 버튼 클릭됨!', video);
    console.log('🔢 전달된 인덱스:', idx);
    console.log('📋 전달된 videos 배열:', videos);
    console.log('🎯 videos[idx] 객체:', videos[idx]);
    
    // 영상 ID 추출
    const videoId = video.videoId || video.id || video.youtubeId;
    console.log('🔍 추출된 videoId:', videoId);
    
    if (!videoId) {
      console.error('영상 ID를 찾을 수 없습니다:', video);
      showToast('❌ 영상 정보가 올바르지 않습니다.', 'error');
      return;
    }
    
    // videos[idx]와 video가 같은 객체인지 확인
    if (videos && videos[idx]) {
      console.log('🔗 video와 videos[idx] 비교:', {
        video_id: video.videoId || video.id,
        videos_idx_id: videos[idx].videoId || videos[idx].id,
        same: (video.videoId || video.id) === (videos[idx].videoId || videos[idx].id)
      });
    }
    
    // 영상 큐와 인덱스 기반으로 팝업 플레이어 열기
    console.log('🚀 initializePlayer 호출 직전:', { videoId, idx, videosLength: videos?.length });
    initializePlayer('home', videos, idx);
    console.log('✅ initializePlayer 호출 완료');
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
  };
}; 