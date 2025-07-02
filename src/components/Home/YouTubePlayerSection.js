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
        playerVars: { autoplay: 1, controls: 1, rel: 0, fs: 1 }
      }}
      onReady={onReady}
      onStateChange={onStateChange}
      onEnd={onEnd}
      className={className}
      style={style}
    />
  );
} 