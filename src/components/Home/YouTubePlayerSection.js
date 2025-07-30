import React from 'react';
import YouTube from 'react-youtube';

export default function YouTubePlayerSection({
  videoId,
  minimized,
  onReady,
  onStateChange,
  onEnd,
  className = '',
  style = {}
}) {
  return (
    <YouTube
      videoId={videoId}
      opts={{
        width: minimized ? '80' : '100%',
        height: minimized ? '80' : '100%',
        playerVars: { 
          autoplay: 1, // 자동 재생 활성화
          mute: 1, // 브라우저 정책 우회를 위해 초기 음소거 (사용자 상호작용 후 해제)
          controls: minimized ? 0 : 1, // 최소화 상태에서는 컨트롤 숨김
          rel: 0, // 관련 동영상 숨김
          fs: 1, // 전체화면 활성화
          modestbranding: 1, // YouTube 브랜딩 최소화
          iv_load_policy: 3, // 주석 표시 안함
          playsinline: 1, // 모바일에서 인라인 재생 유지
          enablejsapi: 1, // JavaScript API 활성화
          origin: window.location.origin, // 보안을 위한 origin 설정
          widget_referrer: window.location.href // 리퍼러 설정
        }
      }}
      onReady={onReady}
      onStateChange={onStateChange}
      onEnd={onEnd}
      className={className}
      style={style}
    />
  );
} 