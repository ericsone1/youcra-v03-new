// YouTube 관련 오류 처리 유틸리티

export const setupYouTubeErrorHandlers = () => {
  // YouTube iframe 메시지 오류 처리
  window.addEventListener('message', (event) => {
    try {
      // YouTube 및 관련 도메인에서 오는 메시지 처리
      if (event.origin === 'https://www.youtube.com' || 
          event.origin === 'https://www.youtube-nocookie.com' ||
          event.origin === 'https://youtube.com') {
        // YouTube 메시지는 정상 처리하되 오류는 무시
        return;
      }
    } catch (error) {
      // 메시지 처리 오류 무시
    }
  }, true);
  
  // postMessage 오류 캐치 및 강화
  const originalPostMessage = window.postMessage;
  window.postMessage = function(message, targetOrigin, transfer) {
    try {
      return originalPostMessage.call(this, message, targetOrigin, transfer);
    } catch (error) {
      // YouTube 관련 postMessage 오류 무시
      if (error.message && (
        error.message.includes('postMessage') ||
        error.message.includes('DOMWindow') ||
        error.message.includes('youtube') ||
        error.message.includes('signature') ||
        error.message.includes('decipher') ||
        error.message.includes('Failed to execute')
      )) {
        return; // 오류 무시
      }
      // 다른 오류는 그대로 throw
      throw error;
    }
  };

  // YouTube API 관련 전역 오류 처리
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('youtube') ||
      event.message.includes('signature') ||
      event.message.includes('decipher') ||
      event.message.includes('www-widgetapi')
    )) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
};

export const getOptimizedYouTubePlayerVars = () => {
  return {
    autoplay: 1,
    controls: 1, // 플레이어 컨트롤 표시
    modestbranding: 0, // YouTube 로고 표시 (사용자 친화적)
    rel: 0, // 관련 동영상 숨김
    origin: window.location.origin,
    enablejsapi: 1,
    fs: 1, // 전체화면 활성화 (사용자 편의성)
    iv_load_policy: 1, // 주석 표시 (기본값)
    cc_load_policy: 1, // 자막 사용 가능
    disablekb: 0, // 키보드 컨트롤 활성화
    playsinline: 1, // 모바일에서 인라인 재생
    widget_referrer: window.location.origin,
    showinfo: 1, // 동영상 정보 표시
    color: 'red', // 진행바 색상 (YouTube 기본)
    theme: 'dark' // 다크 테마 (현대적)
  };
}; 