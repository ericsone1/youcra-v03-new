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

  // 시청 횟수 증가
  const incrementWatchCount = (videoId) => {
    setWatchCounts(prev => {
      const newCounts = {
        ...prev,
        [videoId]: (prev[videoId] || 0) + 1
      };
      
      // localStorage에 저장
      localStorage.setItem('video_watch_counts', JSON.stringify(newCounts));
      console.log(`📈 영상 ${videoId} 시청 횟수 증가:`, newCounts[videoId]);
      
      return newCounts;
    });
  };

  // 특정 영상의 시청 횟수 가져오기
  const getWatchCount = (videoId) => {
    return watchCounts[videoId] || 0;
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
    resetWatchCounts
  };
} 