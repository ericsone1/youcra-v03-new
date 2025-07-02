import React from 'react';
import YouTube from 'react-youtube';
import { useVideoPlayer } from '../../contexts/VideoPlayerContext';

const VideoPlayer = ({ 
  videoId,
  width = "100%",
  height = "200",
  className = "",
  onReady,
  onStateChange,
  onEnd,
  autoplay = true
}) => {
  const { setPlayerLoading } = useVideoPlayer();

  const defaultOptions = {
    width,
    height,
    playerVars: {
      autoplay: autoplay ? 1 : 0,
      controls: 1,
      rel: 0,
      fs: 1,
      playsinline: 1,
      enablejsapi: 1,
      origin: window.location.origin
    }
  };

  const handleReady = (event) => {
    setPlayerLoading(false);
    if (onReady) onReady(event);
  };

  const handleStateChange = (event) => {
    if (onStateChange) onStateChange(event);
  };

  const handleEnd = (event) => {
    if (onEnd) onEnd(event);
  };

  return (
    <div className={`relative ${className}`}>
      <YouTube
        videoId={videoId}
        opts={defaultOptions}
        onReady={handleReady}
        onStateChange={handleStateChange}
        onEnd={handleEnd}
        className="rounded-lg overflow-hidden"
      />
    </div>
  );
};

export default VideoPlayer; 