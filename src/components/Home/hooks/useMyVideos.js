import { useEffect, useState } from 'react';
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';

// 현재 사용자의 영상만 가볍게 조회하는 훅
export function useMyVideos() {
  const { currentUser } = useAuth();
  const [myVideos, setMyVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setMyVideos([]);
      setLoading(false);
      return;
    }

    async function fetchMyVideos() {
      setLoading(true);
      const uid = currentUser.uid;
      const result = [];

      try {
        // 1) 루트 videos 컬렉션에서 내가 등록한 영상
        const rootQ = query(collection(db, 'videos'), where('registeredBy', '==', uid));
        const rootSnap = await getDocs(rootQ);
        rootSnap.forEach(docSnap => {
          result.push({ id: docSnap.id, ...docSnap.data() });
        });

        // 2) users/{uid}/myVideos 서브컬렉션
        const myColSnap = await getDocs(collection(db, 'users', uid, 'myVideos'));
        myColSnap.forEach(docSnap => {
          const data = docSnap.data();
          result.push({ id: docSnap.id, videoId: docSnap.id, ...data });
        });

        // 3) chatRooms/*/videos collectionGroup 쿼리는 인덱스 필요 오류가 있어 일단 생략

      } catch (error) {
        console.warn('[useMyVideos] 일부 경로에서 영상 로드 실패 (무시 가능):', error?.message || error);
      }

      setMyVideos(result);
      setLoading(false);
    }

    fetchMyVideos();
  }, [currentUser]);

  return { myVideos, loading };
} 