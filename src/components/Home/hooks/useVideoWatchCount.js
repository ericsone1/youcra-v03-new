import { useState, useEffect } from 'react';

export function useVideoWatchCount() {
  const [watchCounts, setWatchCounts] = useState({});

  // localStorage에서 시청 횟수 불러오기
  useEffect(() => {
    const savedCounts = localStorage.getItem('video_watch_counts');
    if (savedCounts) {
      try {
        setWatchCounts(JSON.parse(savedCounts));
      } catch (error) {
        console.error('시청 횟수 데이터 로드 실패:', error);
        setWatchCounts({});
      }
    }
  }, []);

  // 시청 횟수 증가 (시청 완료 시간도 기록)
  const incrementWatchCount = (videoId) => {
    setWatchCounts(prev => {
      const newCounts = {
        ...prev,
        [videoId]: {
          watchCount: (prev[videoId]?.watchCount || 0) + 1,
          lastWatchedAt: Date.now(), // 시청 완료 시간 저장
          watchHistory: [
            ...(prev[videoId]?.watchHistory || []),
            Date.now()
          ].slice(-10) // 최근 10개만 유지
        }
      };
      
      // localStorage에 저장
      localStorage.setItem('video_watch_counts', JSON.stringify(newCounts));
      console.log(`📈 영상 ${videoId} 시청 횟수 증가:`, newCounts[videoId]);
      
      return newCounts;
    });
  };

  // 특정 영상의 시청 정보 가져오기
  const getWatchCount = (videoId) => {
    const info = watchCounts[videoId] || { 
      watchCount: 0, 
      lastWatchedAt: null,
      watchHistory: []
    };
    return info;
  };

  // 1시간 재시청 제한 체크 (로컬스토리지 기반)
  const canRewatch = (videoId) => {
    const info = watchCounts[videoId];
    if (!info || !info.lastWatchedAt) {
      return true; // 시청한 적 없으면 시청 가능
    }
    
    const oneHourInMs = 60 * 60 * 1000; // 1시간
    const timePassed = Date.now() - info.lastWatchedAt;
    const canWatch = timePassed >= oneHourInMs;
    
    console.log('⏰ [useVideoWatchCount] 로컬 재시청 가능 여부 체크:', {
      videoId,
      lastWatchedAt: info.lastWatchedAt,
      timePassed: Math.floor(timePassed / 1000 / 60), // 분 단위
      canWatch
    });
    
    return canWatch;
  };

  // 재시청 가능까지 남은 시간 (분 단위) - 로컬스토리지 기반
  const getTimeUntilRewatch = (videoId) => {
    const info = watchCounts[videoId];
    if (!info || !info.lastWatchedAt) {
      return 0; // 시청한 적 없으면 0분
    }
    
    const oneHourInMs = 60 * 60 * 1000;
    const timePassed = Date.now() - info.lastWatchedAt;
    const remainingMs = oneHourInMs - timePassed;
    
    if (remainingMs <= 0) {
      return 0; // 이미 재시청 가능
    }
    
    const remainingMinutes = Math.ceil(remainingMs / 1000 / 60); // 분 단위로 올림
    
    console.log('⏱️ [useVideoWatchCount] 로컬 재시청까지 남은 시간:', {
      videoId,
      remainingMinutes,
      remainingMs
    });
    
    return remainingMinutes;
  };

  // 시청 히스토리 가져오기
  const getWatchHistory = (videoId) => {
    const info = watchCounts[videoId];
    return info?.watchHistory || [];
  };

  // 오늘 시청한 영상 개수
  const getTodayWatchCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    let todayCount = 0;
    Object.values(watchCounts).forEach(info => {
      if (info.watchHistory) {
        todayCount += info.watchHistory.filter(timestamp => timestamp >= todayTimestamp).length;
      }
    });
    
    return todayCount;
  };

  // 시청 횟수 초기화 (개발용)
  const resetWatchCounts = () => {
    setWatchCounts({});
    localStorage.removeItem('video_watch_counts');
    console.log('🔄 모든 시청 횟수 초기화됨');
  };

  return {
    watchCounts,
    incrementWatchCount,
    getWatchCount,
    canRewatch,
    getTimeUntilRewatch,
    getWatchHistory,
    getTodayWatchCount,
    resetWatchCounts
  };
} 