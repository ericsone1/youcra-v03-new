import React from 'react';
import HomeVideoPlayer from './HomeVideoPlayer';

export default function HomeVideoPlayerSection({
  playerVisible,
  playerQueue,
  playerIndex,
  playerMinimized,
  playerPos,
  onClose,
  onNext,
  onPrev,
  onMinimize,
  onRestore,
  onDrag,
  onCertifyComplete,
}) {
  if (!playerVisible || !playerQueue || playerQueue.length === 0) return null;
  return (
    <HomeVideoPlayer
      video={playerQueue[playerIndex]}
      videoQueue={playerQueue}
      currentIndex={playerIndex}
      minimized={playerMinimized}
      pos={playerPos}
      onClose={onClose}
      onNext={onNext}
      onPrev={onPrev}
      onMinimize={onMinimize}
      onRestore={onRestore}
      onDrag={onDrag}
      onCertifyComplete={onCertifyComplete}
    />
  );
} 