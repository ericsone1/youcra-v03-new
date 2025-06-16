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
    rel: 0, // 관련 동영상 숨김
    origin: window.location.origin,
    enablejsapi: 1,
    fs: 1, // 전체화면 활성화
    playsinline: 1, // 모바일에서 인라인 재생
    widget_referrer: window.location.origin
    // YouTube 기본 테마와 색상 유지 (color, theme 제거)
    // modestbranding, iv_load_policy, cc_load_policy 등 기본값 사용
  };
}; 