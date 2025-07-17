import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';

const WatchedVideosContext = createContext();

export const useWatchedVideos = () => {
  const ctx = useContext(WatchedVideosContext);
  if (!ctx) throw new Error('useWatchedVideos must be used within WatchedVideosProvider');
  return ctx;
};

export const WatchedVideosProvider = ({ children }) => {
  const { user: currentUser } = useAuth();
  const [watchedMap, setWatchedMap] = useState({}); // { videoId: { watchCount, certified, lastWatchedAt, watchedAt } }

  // Firestore 실시간 리스너
  useEffect(() => {
    if (!currentUser) {
      console.log('🔍 [WatchedVideosContext] 사용자 없음 - watchedMap 초기화');
      setWatchedMap({});
      return;
    }

    console.log('🔍 [WatchedVideosContext] 실시간 리스너 시작:', {
      userId: currentUser.uid,
      collectionPath: `users/${currentUser.uid}/watchedVideos`
    });

    const colRef = collection(db, 'users', currentUser.uid, 'watchedVideos');
    const unsub = onSnapshot(colRef, (snap) => {
      console.log('📊 [WatchedVideosContext] Firebase 스냅샷:', {
        docsCount: snap.docs.length,
        changes: snap.docChanges().map(change => ({
          type: change.type,
          id: change.doc.id,
          data: change.doc.data()
        }))
      });

      const map = {};
      snap.forEach((docSnap) => {
        map[docSnap.id] = docSnap.data();
      });
      
      console.log('✅ [WatchedVideosContext] watchedMap 업데이트:', map);
      setWatchedMap(map);
    }, (error) => {
      console.error('❌ [WatchedVideosContext] Firebase 리스너 오류:', error);
    });
    
    return () => {
      console.log('🔄 [WatchedVideosContext] 리스너 정리');
      unsub();
    };
  }, [currentUser]);

  // 헬퍼: 업서트
  const upsertWatched = useCallback(async (videoId, data) => {
    if (!currentUser || !videoId) {
      console.warn('⚠️ [WatchedVideosContext] upsertWatched 실패 - 사용자 또는 videoId 없음:', { currentUser: !!currentUser, videoId });
      return;
    }
    
    const docRef = doc(db, 'users', currentUser.uid, 'watchedVideos', videoId);
    const updateData = { ...data, updatedAt: serverTimestamp() };
    
    console.log('🔄 [WatchedVideosContext] Firebase 저장 시작:', {
      userId: currentUser.uid,
      videoId,
      path: `users/${currentUser.uid}/watchedVideos/${videoId}`,
      data: updateData
    });
    
    // 📌 1) 낙관적 로컬 업데이트 (버튼 즉시 비활성화 등 UI 반영)
    setWatchedMap(prev => ({
      ...prev,
      [videoId]: {
        ...(prev[videoId] || {}),
        ...data,
        updatedAt: Date.now(), // 로컬 타임스탬프
      }
    }));

    try {
      await setDoc(docRef, updateData, { merge: true });
      console.log('✅ [WatchedVideosContext] Firebase 저장 완료:', { videoId, data: updateData });
    } catch (error) {
      console.error('❌ [WatchedVideosContext] Firebase 저장 실패:', error);
      throw error;
    }
  }, [currentUser]);

  const incrementWatchCount = async (videoId) => {
    const prev = watchedMap[videoId]?.watchCount || 0;
    const newCount = prev + 1;
    console.log('🔢 [WatchedVideosContext] 시청 횟수 증가:', { videoId, prev, newCount });
    await upsertWatched(videoId, { watchCount: newCount });
  };

  const setCertified = async (videoId, certified = true) => {
    console.log('✅ [WatchedVideosContext] 인증 상태 설정:', { videoId, certified });
    
    // 시청 완료 시 현재 시간 저장
    const updateData = { certified };
    if (certified) {
      updateData.watchedAt = Date.now(); // 시청 완료 시간 저장 (밀리초)
      updateData.lastWatchedAt = serverTimestamp(); // Firebase 서버 시간도 저장
      console.log('🕒 [WatchedVideosContext] 시청 완료 시간 저장:', updateData.watchedAt);
    }
    
    await upsertWatched(videoId, updateData);
  };

  const getWatchInfo = (videoId) => {
    const info = watchedMap[videoId] || { watchCount: 0, certified: false, watchedAt: null };
    console.log('📖 [WatchedVideosContext] 시청 정보 조회:', { videoId, info });
    return info;
  };

  // 1시간 재시청 제한 체크
  const canRewatch = (videoId) => {
    const info = watchedMap[videoId];
    if (!info || !info.certified || !info.watchedAt) {
      return true; // 시청한 적 없으면 시청 가능
    }
    
    const oneHourInMs = 60 * 60 * 1000; // 1시간 = 60분 * 60초 * 1000밀리초
    const timePassed = Date.now() - info.watchedAt;
    const canWatch = timePassed >= oneHourInMs;
    
    console.log('⏰ [WatchedVideosContext] 재시청 가능 여부 체크:', {
      videoId,
      watchedAt: info.watchedAt,
      timePassed: Math.floor(timePassed / 1000 / 60), // 분 단위
      canWatch
    });
    
    return canWatch;
  };

  // 재시청 가능까지 남은 시간 (분 단위)
  const getTimeUntilRewatch = (videoId) => {
    const info = watchedMap[videoId];
    if (!info || !info.certified || !info.watchedAt) {
      return 0; // 시청한 적 없으면 0분
    }
    
    const oneHourInMs = 60 * 60 * 1000;
    const timePassed = Date.now() - info.watchedAt;
    const remainingMs = oneHourInMs - timePassed;
    
    if (remainingMs <= 0) {
      return 0; // 이미 재시청 가능
    }
    
    const remainingMinutes = Math.ceil(remainingMs / 1000 / 60); // 분 단위로 올림
    
    console.log('⏱️ [WatchedVideosContext] 재시청까지 남은 시간:', {
      videoId,
      remainingMinutes,
      remainingMs
    });
    
    return remainingMinutes;
  };

  // 시청 완료된 영상 중 1시간이 지나지 않은 영상들 필터링
  const getRecentlyWatchedVideos = () => {
    const recentlyWatched = [];
    Object.keys(watchedMap).forEach(videoId => {
      const info = watchedMap[videoId];
      if (info && info.certified && !canRewatch(videoId)) {
        recentlyWatched.push({
          videoId,
          timeUntilRewatch: getTimeUntilRewatch(videoId)
        });
      }
    });
    return recentlyWatched;
  };

  const value = {
    watchedMap,
    getWatchInfo,
    incrementWatchCount,
    setCertified,
    canRewatch,
    getTimeUntilRewatch,
    getRecentlyWatchedVideos,
  };

  return (
    <WatchedVideosContext.Provider value={value}>
      {children}
    </WatchedVideosContext.Provider>
  );
}; 