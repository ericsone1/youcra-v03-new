import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addWatchTime } from '../services/tokenService';

/**
 * 시청시간 추적 및 토큰 발급 훅
 */
export const useWatchTime = (videoId, isPlaying = false, onTokenEarned = null) => {
  const { currentUser } = useAuth();
  const watchStartTime = useRef(null);
  const accumulatedTime = useRef(0);

  useEffect(() => {
    if (!currentUser || !videoId) return;

    if (isPlaying) {
      // 재생 시작
      watchStartTime.current = Date.now();
    } else {
      // 재생 중지 또는 일시정지
      if (watchStartTime.current) {
        const sessionTime = Math.floor((Date.now() - watchStartTime.current) / 1000);
        accumulatedTime.current += sessionTime;
        watchStartTime.current = null;

        console.log(`⏱️ [useWatchTime] ${videoId} 시청 세션: ${sessionTime}초`);
      }
    }

    // 컴포넌트 언마운트 시 누적 시간 저장
    return () => {
      if (watchStartTime.current) {
        const sessionTime = Math.floor((Date.now() - watchStartTime.current) / 1000);
        accumulatedTime.current += sessionTime;
      }

      if (accumulatedTime.current > 0) {
        saveWatchTime();
      }
    };
  }, [isPlaying, videoId, currentUser]);

  const saveWatchTime = async () => {
    if (!currentUser || accumulatedTime.current === 0) return;

    try {
      console.log(`💾 [useWatchTime] ${videoId} 총 시청시간 저장: ${accumulatedTime.current}초`);
      
      const result = await addWatchTime(currentUser.uid, accumulatedTime.current);
      
      // 새로운 토큰이 발급되었다면 알림 콜백 호출
      if (result && result.newTokensEarned > 0 && onTokenEarned) {
        onTokenEarned({
          tokensEarned: result.newTokensEarned,
          totalTokens: result.updatedStats.availableTokens,
          videoId
        });
      }
      
      accumulatedTime.current = 0;
      
    } catch (error) {
      console.error('❌ [useWatchTime] 시청시간 저장 실패:', error);
    }
  };

  // 수동으로 시청시간 저장 (예: 영상 종료 시)
  const flushWatchTime = () => {
    if (watchStartTime.current) {
      const sessionTime = Math.floor((Date.now() - watchStartTime.current) / 1000);
      accumulatedTime.current += sessionTime;
      watchStartTime.current = null;
    }
    
    if (accumulatedTime.current > 0) {
      saveWatchTime();
    }
  };

  return {
    flushWatchTime,
    getCurrentWatchTime: () => accumulatedTime.current
  };
}; 