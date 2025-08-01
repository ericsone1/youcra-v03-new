import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, getDocs, query, where, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { deductTokenForView } from '../services/tokenService';

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

  const setCertified = async (videoId, certified = true, watchedFrom = 'main') => {
    console.log('✅ [WatchedVideosContext] 인증 상태 설정:', { videoId, certified, watchedFrom });
    
    // 시청 완료 시 현재 시간 저장
    const updateData = { certified };
    if (certified) {
      updateData.watchedAt = Date.now(); // 시청 완료 시간 저장 (밀리초)
      updateData.lastWatchedAt = serverTimestamp(); // Firebase 서버 시간도 저장
      updateData.watchedFrom = watchedFrom; // 시청한 곳 저장 (main: 메인피드, room: 채팅방)
      console.log('🕒 [WatchedVideosContext] 시청 완료 시간 저장:', updateData.watchedAt);
      
      // 유크라 조회수 업데이트
      await updateUcraViewCount(videoId);
    }
    
    await upsertWatched(videoId, updateData);
  };

  // 유크라 조회수 업데이트 함수 (토큰 차감 포함)
  const updateUcraViewCount = async (videoId) => {
    if (!videoId) return;
    try {
      console.log('📊 [WatchedVideosContext] 유크라 조회수 업데이트 시작 (ALL DOCS):', videoId);

      // 영상 정보와 소유자 정보 수집
      let videoInfo = null;
      let ownerUid = null;
      let durationSeconds = 0;

      // 1. 모든 채팅방의 영상 문서 업데이트
      const roomsSnapshot = await getDocs(collection(db, 'chatRooms'));
      for (const roomDoc of roomsSnapshot.docs) {
        const videosQuery = query(
          collection(db, 'chatRooms', roomDoc.id, 'videos'),
          where('videoId', '==', videoId)
        );
        const videosSnapshot = await getDocs(videosQuery);
        for (const videoDoc of videosSnapshot.docs) {
          try {
            const videoData = videoDoc.data();
            
            // 첫 번째 영상에서 정보 수집
            if (!videoInfo) {
              videoInfo = videoData;
              ownerUid = videoData.registeredBy || videoData.ownerUid;
              durationSeconds = videoData.durationSeconds || 0;
              
              console.log('📋 [WatchedVideosContext] 영상 정보 수집:', {
                videoId,
                ownerUid,
                durationSeconds,
                durationMinutes: Math.floor(durationSeconds / 60)
              });
            }
            
            await updateDoc(doc(db, 'chatRooms', roomDoc.id, 'videos', videoDoc.id), {
              ucraViewCount: increment(1),
              lastViewedAt: serverTimestamp(),
            });
          } catch (err) {
            console.error('❌ [WatchedVideosContext] 채팅방 영상 조회수 업데이트 실패:', err);
          }
        }
      }

      // 2. 루트 videos 컬렉션 영상 문서 업데이트
      const rootVideosQuery = query(collection(db, 'videos'), where('videoId', '==', videoId));
      const rootVideosSnapshot = await getDocs(rootVideosQuery);
      for (const videoDoc of rootVideosSnapshot.docs) {
        try {
          const videoData = videoDoc.data();
          
          // 정보가 없으면 루트에서 수집
          if (!videoInfo) {
            videoInfo = videoData;
            ownerUid = videoData.registeredBy || videoData.ownerUid;
            durationSeconds = videoData.durationSeconds || 0;
          }
          
          await updateDoc(doc(db, 'videos', videoDoc.id), {
            ucraViewCount: increment(1),
            lastViewedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('❌ [WatchedVideosContext] 루트 영상 조회수 업데이트 실패:', err);
        }
      }

      // 3. 토큰 차감 (소유자가 있고 영상 길이가 있는 경우)
      if (ownerUid && durationSeconds > 0) {
        try {
          const tokenResult = await deductTokenForView(videoId, ownerUid, durationSeconds);
          
          if (tokenResult.success) {
            console.log('✅ [WatchedVideosContext] 토큰 차감 성공:', {
              videoId,
              ownerUid,
              deducted: tokenResult.tokensDeducted.toFixed(2),
              remaining: tokenResult.remainingTokens.toFixed(2)
            });
          } else {
            console.warn('⚠️ [WatchedVideosContext] 토큰 차감 실패:', {
              videoId,
              ownerUid,
              reason: tokenResult.reason
            });
          }
        } catch (error) {
          console.error('❌ [WatchedVideosContext] 토큰 차감 중 오류:', error);
        }
      } else {
        console.warn('⚠️ [WatchedVideosContext] 토큰 차감 생략:', {
          videoId,
          ownerUid: !!ownerUid,
          durationSeconds
        });
      }

      console.log('✅ [WatchedVideosContext] 유크라 조회수 전체 업데이트 완료');
    } catch (error) {
      console.error('❌ [WatchedVideosContext] 유크라 조회수 업데이트 실패:', error);
    }
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
    
    const oneHourInMs = 60 * 60 * 1000; // 1시간
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

  // 시청 완료된 모든 영상 목록 반환
  const getWatchedVideos = () => {
    const watchedVideos = [];
    Object.keys(watchedMap).forEach(videoId => {
      const info = watchedMap[videoId];
      if (info && info.certified) {
        watchedVideos.push({
          videoId,
          watchCount: info.watchCount || 0,
          watchedAt: info.watchedAt,
          watchedFrom: info.watchedFrom || 'main'
        });
      }
    });
    return watchedVideos;
  };

  const value = {
    watchedMap,
    getWatchInfo,
    incrementWatchCount,
    setCertified,
    canRewatch,
    getTimeUntilRewatch,
    getRecentlyWatchedVideos,
    getWatchedVideos,
    upsertWatched, // 누락된 함수 추가
  };

  return (
    <WatchedVideosContext.Provider value={value}>
      {children}
    </WatchedVideosContext.Provider>
  );
}; 