import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useUcraVideos } from './useUcraVideos';

/**
 * 내가 등록한 영상의 시청자들과 그들의 업로드 영상을 가져오는 훅
 */
export function useMyVideoViewers() {
  const { currentUser } = useAuth();
  const { ucraVideos, loading: loadingUcraVideos } = useUcraVideos();
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState([]);

  // 초기 로딩 상태 보장
  useEffect(() => {
    setLoading(true);
  }, []);



  useEffect(() => {
    if (!currentUser) {
      setViewers([]);
      setLoading(false);
      return;
    }

    if (loadingUcraVideos || !ucraVideos) {
      setLoading(true); // 로딩 중일 때 명시적으로 로딩 상태 유지
      return;
    }

    setLoading(true);

    async function fetchViewers() {
      try {
        // 1. 내가 등록한 영상들 찾기
        const myVideoList = ucraVideos.filter(
          v => v.registeredBy === currentUser.uid || 
               v.uploaderUid === currentUser.uid ||
               v.createdBy === currentUser.uid
        );
        
        if (myVideoList.length === 0) {
          setViewers([]);
          setLoading(false);
          return;
        }

        const myVideoIds = myVideoList.map(v => v.videoId || v.id);

        // 2. 모든 사용자 검사
        const usersSnap = await getDocs(collection(db, 'users'));

        const viewerMap = new Map(); // userId -> viewer 객체

        // 3. 각 사용자의 시청 기록 확인
        for (const userDoc of usersSnap.docs.slice(0, 30)) { // 성능상 30명만 검사
          const userId = userDoc.id;
          if (userId === currentUser.uid) continue;



          try {
            const watchedCol = collection(db, 'users', userId, 'watchedVideos');
            const watchedSnap = await getDocs(watchedCol);
            


            // 시청한 내 영상들 찾기
            const watchedMyVideos = [];
            watchedSnap.docs.forEach(watchDoc => {
              // videoId를 doc.id 또는 doc.data().videoId에서 찾기
              const watchedVideoId = watchDoc.id || watchDoc.data()?.videoId;
              
                              if (myVideoIds.includes(watchedVideoId)) {
                  const myVideo = myVideoList.find(v => (v.videoId || v.id) === watchedVideoId);
                  if (myVideo) {
                  const watchData = watchDoc.data();
                  watchedMyVideos.push({
                    ...myVideo,
                    watchCount: watchData?.watchCount || 1,
                    lastWatchedAt: watchData?.lastWatchedAt || new Date()
                  });
                }
              }
            });

                          if (watchedMyVideos.length > 0) {
              
              // 시청자 정보 저장
              const userProfile = userDoc.data();
              
              // 시청자의 업로드 영상들 가져오기
              let uploadedVideos = [];
              
              // 먼저 ucraVideos에서 찾기
              const userUcraVideos = ucraVideos.filter(v => 
                v.registeredBy === userId || 
                v.uploaderUid === userId ||
                v.createdBy === userId
              );

              if (userUcraVideos.length > 0) {
                uploadedVideos = userUcraVideos.map(v => ({
                  ...v,
                  videoId: v.videoId || v.id
                }));
              } else {
                // 없으면 user의 myVideos 서브컬렉션에서 가져오기
                try {
                  const userVideosSnap = await getDocs(collection(db, 'users', userId, 'myVideos'));
                  uploadedVideos = userVideosSnap.docs.map(doc => ({
                    videoId: doc.id,
                    ...doc.data()
                  }));
                } catch (error) {
                  // myVideos 가져오기 실패 시 빈 배열로 처리
                }
              }

              viewerMap.set(userId, {
                user: {
                  uid: userId,
                  displayName: userProfile?.displayName || userProfile?.name || '익명',
                  email: userProfile?.email || '',
                  photoURL: userProfile?.photoURL || userProfile?.profileImage || '',
                  ...userProfile
                },
                watchedMyVideos,
                uploadedVideos: uploadedVideos.slice(0, 10) // 최대 10개만
              });

              
            }
                      } catch (error) {
              // 사용자 처리 오류 시 무시하고 다음 사용자로
            }
        }

        const finalViewers = Array.from(viewerMap.values());
        setViewers(finalViewers);
        setLoading(false);

      } catch (error) {
        setViewers([]);
        setLoading(false);
      }
    }

    fetchViewers();
  }, [currentUser, ucraVideos, loadingUcraVideos]);



  return { loading, viewers };
} 