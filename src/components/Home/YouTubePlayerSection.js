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
          autoplay: 1, // 최소화 상태에서도 자동재생 유지
          controls: minimized ? 0 : 1, // 최소화 상태에서는 컨트롤 숨김
          rel: 0, 
          fs: 1,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1, // 모바일에서 인라인 재생 유지
          enablejsapi: 1 // JavaScript API 활성화
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