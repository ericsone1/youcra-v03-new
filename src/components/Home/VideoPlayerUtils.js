// 🛠️ 비디오 플레이어 유틸리티 함수들
// 원본: HomeVideoPlayer.js에서 추출

// 시간 포맷팅 함수
export function formatTime(sec) {
  if (isNaN(sec) || sec < 0) return '0:00';
  
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = Math.floor(sec % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// 초기 위치 계산
export function getInitialPosition(minimized, pos) {
  if (pos) return pos;
  return minimized 
    ? { x: window.innerWidth - 100, y: window.innerHeight - 100 }
    : { x: (window.innerWidth - 400) / 2, y: 50 };
}

// 드래그 시작 핸들러
export function handleDragStart(e, setIsDragging, position, setDragStart, onDrag) {
  // 버튼이나 YouTube 플레이어 영역 클릭 시 드래그 방지
  if (e.target.closest('button') || e.target.closest('iframe') || e.target.closest('.youtube-player')) {
    return false;
  }
  
  e.preventDefault();
  setIsDragging(true);
  
  // 현재 마우스 위치에서 플레이어 위치를 뺀 오프셋을 저장
  setDragStart({
    x: e.clientX - position.x,
    y: e.clientY - position.y
  });
  
  // 드래그 중 선택 방지
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  
  onDrag && onDrag(true);
  return true;
}

// 드래그 이동 핸들러
export function handleDragMove(e, isDragging, dragStart, setPosition, onDrag) {
  if (!isDragging) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  // 새로운 위치 = 현재 마우스 위치 - 드래그 시작 오프셋
  const newX = e.clientX - dragStart.x;
  const newY = e.clientY - dragStart.y;
  
  // 화면 경계 체크
  const maxX = window.innerWidth - 400;
  const maxY = window.innerHeight - 300;
  
  setPosition({
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  });
  
  onDrag && onDrag(true);
}

// 드래그 종료 핸들러
export function handleDragEnd(setIsDragging, onDrag) {
  setIsDragging(false);
  
  // 선택 방지 해제
  document.body.style.userSelect = '';
  document.body.style.webkitUserSelect = '';
  
  onDrag && onDrag(false);
}

// 터치 드래그 시작 핸들러
export function handleTouchStart(e, setIsDragging, position, setDragStart, onDrag) {
  if (e.target.closest('button') || e.target.closest('iframe') || e.target.closest('.youtube-player')) {
    return false;
  }
  
  e.preventDefault();
  setIsDragging(true);
  
  const touch = e.touches[0];
  setDragStart({
    x: touch.clientX - position.x,
    y: touch.clientY - position.y
  });
  
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  
  onDrag && onDrag(true);
  return true;
}

// 터치 드래그 이동 핸들러
export function handleTouchMove(e, isDragging, dragStart, setPosition, onDrag) {
  if (!isDragging) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const touch = e.touches[0];
  const newX = touch.clientX - dragStart.x;
  const newY = touch.clientY - dragStart.y;
  
  const maxX = window.innerWidth - 400;
  const maxY = window.innerHeight - 300;
  
  setPosition({
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  });
  
  onDrag && onDrag(true);
}

// 터치 드래그 종료 핸들러
export function handleTouchEnd(setIsDragging, onDrag) {
  setIsDragging(false);
  
  document.body.style.userSelect = '';
  document.body.style.webkitUserSelect = '';
  
  onDrag && onDrag(false);
}

// 인증 상태 관리 유틸리티
export const CERT_STAGES = {
  WATCHING: 'watching',
  COUNTDOWN: 'countdown',
  CERTIFYING: 'certifying',
  CERTIFIED: 'certified'
};

// 인증 완료 처리
export async function handleCertificationComplete(
  videoData,
  incrementWatchCount,
  watchedVideosSetCertified,
  setFanCertified,
  setCertStage,
  setCertLoading,
  onCertifyComplete
) {
  try {
    setCertLoading(true);
    
    // 시청 횟수 증가
    await incrementWatchCount(videoData.videoId);
    
    // 인증 상태 설정
    await watchedVideosSetCertified(videoData.videoId, true);
    setFanCertified(true);
    setCertStage(CERT_STAGES.CERTIFIED);
    
    // 콜백 호출
    onCertifyComplete && onCertifyComplete(videoData);
    
  } catch (error) {
    console.error('인증 완료 처리 중 오류:', error);
  } finally {
    setCertLoading(false);
  }
}

// 영상 재생 상태 관리
export function handleVideoStateChange(
  event,
  setWatchSeconds,
  setLocalVideoEnded,
  setCertStage,
  setShowCountdown,
  setCountdown,
  actualDuration,
  watchInterval,
  setWatchInterval,
  setCertificationTimer,
  setShowCertificationDelay
) {
  const state = event.data;
  
  if (state === 1) { // 재생 중
    setLocalVideoEnded(false);
    setCertStage(CERT_STAGES.WATCHING);
    
    // 시청 시간 추적 시작
    const interval = setInterval(() => {
      setWatchSeconds(prev => {
        const newSeconds = prev + 1;
        
        // 80% 시청 시 카운트다운 시작
        if (newSeconds >= actualDuration * 0.8 && !showCountdown) {
          setShowCountdown(true);
          setCountdown(5);
          setCertStage(CERT_STAGES.COUNTDOWN);
        }
        
        return newSeconds;
      });
    }, 1000);
    
    setWatchInterval(interval);
    
  } else if (state === 0) { // 재생 종료
    setLocalVideoEnded(true);
    clearInterval(watchInterval);
    setWatchInterval(null);
    
    // 인증 지연 타이머 시작
    setShowCertificationDelay(true);
    setCertificationTimer(3);
    
    const certTimer = setInterval(() => {
      setCertificationTimer(prev => {
        if (prev <= 1) {
          clearInterval(certTimer);
          setShowCertificationDelay(false);
          setCertStage(CERT_STAGES.CERTIFYING);
        }
        return prev - 1;
      });
    }, 1000);
  }
} 