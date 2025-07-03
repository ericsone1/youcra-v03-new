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
  const { currentUser } = useAuth();
  const [watchedMap, setWatchedMap] = useState({}); // { videoId: { watchCount, certified, lastWatchedAt } }

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
    await upsertWatched(videoId, { certified });
  };

  const getWatchInfo = (videoId) => {
    const info = watchedMap[videoId] || { watchCount: 0, certified: false };
    console.log('📖 [WatchedVideosContext] 시청 정보 조회:', { videoId, info });
    return info;
  };

  const value = {
    watchedMap,
    getWatchInfo,
    incrementWatchCount,
    setCertified,
  };

  return (
    <WatchedVideosContext.Provider value={value}>
      {children}
    </WatchedVideosContext.Provider>
  );
}; 