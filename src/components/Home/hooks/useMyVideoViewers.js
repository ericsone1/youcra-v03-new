import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';
import { useUcraVideos } from './useUcraVideos';

/**
 * 내가 등록한 영상과, 내 영상을 시청한 유저 및 그 유저가 시청한 내 영상 리스트를 반환
 */
export function useMyVideoViewers() {
  const { currentUser } = useAuth();
  const { ucraVideos } = useUcraVideos();
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState([]); // [{user, watchedMyVideos: [video, ...]}]
  const [myVideos, setMyVideos] = useState([]);

  useEffect(() => {
    // 로그인하지 않은 경우 즉시 종료 (시청자 없음)
    if (!currentUser) {
      setViewers([]);
      setMyVideos([]);
      setLoading(false);
      return;
    }

    // 아직 내 영상 데이터가 로드되지 않았다면 로딩 유지
    if (!ucraVideos) return;

    setLoading(true);

    // 1. 내가 등록한 영상 리스트
    const myVideoList = ucraVideos.filter(
      v => v.registeredBy === currentUser.uid || v.registeredBy === currentUser.email
    );
    setMyVideos(myVideoList);
    const myVideoIds = myVideoList.map(v => v.videoId || v.id);

    // 2. 모든 유저의 watchedVideos에서 내 영상 시청자 찾기
    async function fetchViewers() {
      const usersSnap = await getDocs(collection(db, 'users'));
      const viewerArr = [];
      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        if (userId === currentUser.uid) continue; // 본인은 제외
        const watchedCol = collection(db, 'users', userId, 'watchedVideos');
        const watchedSnap = await getDocs(watchedCol);
        const watchedMyVideos = [];
        watchedSnap.forEach(docSnap => {
          const vid = docSnap.id;
          if (myVideoIds.includes(vid)) {
            // 내 영상 중 시청한 것만
            const video = myVideoList.find(v => (v.videoId || v.id) === vid);
            if (video) watchedMyVideos.push(video);
          }
        });
        if (watchedMyVideos.length > 0) {
          // 유저 프로필 정보도 가져오기
          const userProfile = userDoc.data();
          viewerArr.push({
            user: { uid: userId, ...userProfile },
            watchedMyVideos
          });
        }
      }
      setViewers(viewerArr);
      setLoading(false);
    }
    fetchViewers();
  }, [currentUser, ucraVideos]);

  return { loading, viewers, myVideos };
} 