import { useState } from 'react';

export function useHomePlayerState() {
  const [playerQueue, setPlayerQueue] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [playerMinimized, setPlayerMinimized] = useState(false);
  const [playerPos, setPlayerPos] = useState(null);
  const [playerVisible, setPlayerVisible] = useState(false);

  const openPlayer = (queue, idx = 0) => {
    setPlayerQueue(queue);
    setPlayerIndex(idx);
    setPlayerMinimized(false);
    setPlayerVisible(true);
  };

  const closePlayer = () => {
    setPlayerVisible(false);
  };

  const goNextVideo = () => {
    if (playerIndex < playerQueue.length - 1) {
      setPlayerIndex(playerIndex + 1);
    } else {
      setPlayerIndex(0); // 반복재생
    }
  };

  const goPrevVideo = () => {
    if (playerIndex > 0) {
      setPlayerIndex(playerIndex - 1);
    } else {
      setPlayerIndex(playerQueue.length - 1);
    }
  };

  const minimizePlayer = () => setPlayerMinimized(true);
  const restorePlayer = () => setPlayerMinimized(false);
  const movePlayer = (pos) => setPlayerPos(pos);

  return {
    playerQueue,
    setPlayerQueue,
    playerIndex,
    setPlayerIndex,
    playerMinimized,
    setPlayerMinimized,
    playerPos,
    setPlayerPos,
    playerVisible,
    setPlayerVisible,
    openPlayer,
    closePlayer,
    goNextVideo,
    goPrevVideo,
    minimizePlayer,
    restorePlayer,
    movePlayer,
  };
} 