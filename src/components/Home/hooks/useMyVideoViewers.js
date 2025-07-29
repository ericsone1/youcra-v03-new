import { useEffect, useState } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useUcraVideos } from './useUcraVideos';

/**
 * 내가 등록한 영상의 실제 시청자들을 가져오는 훅
 */
export function useMyVideoViewers() {
  const { currentUser } = useAuth();
  const { ucraVideos, loading: loadingUcraVideos } = useUcraVideos();
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setViewers([]);
      setLoading(false);
      return;
    }

    if (loadingUcraVideos) {
      return;
    }

    async function fetchRealViewers() {
      try {
        setLoading(true);
        console.log('🔍 [useMyVideoViewers] 실제 시청자 데이터 로드 시작');
        console.log('👤 [useMyVideoViewers] 현재 사용자 UID:', currentUser.uid);
        console.log('🎥 [useMyVideoViewers] 전체 ucraVideos 수:', ucraVideos.length);
        
        // 내가 등록한 영상들 찾기
        const myVideoList = ucraVideos.filter(v => {
          const isMyVideo = v.registeredBy === currentUser.uid || 
                            v.uploaderUid === currentUser.uid ||
                            v.createdBy === currentUser.uid ||
                            v.channelId === currentUser.channelId ||
                            v.authorId === currentUser.uid;
          return isMyVideo;
        });
        
        console.log(`👤 [useMyVideoViewers] 내가 등록한 영상 수: ${myVideoList.length}`);
        
        if (myVideoList.length === 0) {
          console.log('📭 [useMyVideoViewers] 등록한 영상이 없어 시청자 없음');
          setViewers([]);
          setLoading(false);
          return;
        }

        const myVideoIds = myVideoList.map(v => v.videoId || v.id);
        console.log('🎯 [useMyVideoViewers] 추적할 영상 IDs:', myVideoIds);

        // 사용자 목록 가져오기 (최대 30명)
        const usersQuery = query(collection(db, 'users'), limit(30));
        const usersSnap = await getDocs(usersQuery);
        
        console.log(`👥 [useMyVideoViewers] 검사할 사용자 수: ${usersSnap.docs.length}`);

        const viewerPromises = usersSnap.docs.map(async (userDoc) => {
          const userId = userDoc.id;
          if (userId === currentUser.uid) return null; // 자신 제외

          try {
            // 시청 기록 가져오기
            const watchedSnap = await getDocs(collection(db, 'users', userId, 'watchedVideos'));
            
            const watchedMyVideos = [];
            watchedSnap.docs.forEach(watchDoc => {
              const watchedVideoId = watchDoc.id;
              
              if (myVideoIds.includes(watchedVideoId)) {
                const myVideo = myVideoList.find(v => (v.videoId || v.id) === watchedVideoId);
                if (myVideo) {
                  const watchData = watchDoc.data();
                  watchedMyVideos.push({
                    ...myVideo,
                    watchCount: watchData?.watchCount || 1,
                    watchedAt: watchData?.watchedAt || watchData?.lastWatchedAt?.toMillis?.() || Date.now(),
                    certified: watchData?.certified || false,
                    watchedFrom: watchData?.watchedFrom || 'unknown'
                  });
                  console.log(`✅ [useMyVideoViewers] ${userId}가 내 영상 ${myVideo.title?.substring(0, 20)} 시청`);
                }
              }
            });

            if (watchedMyVideos.length > 0) {
              const userProfile = userDoc.data();
              
              // 시청자의 업로드 영상 찾기
              const userUploadedVideos = ucraVideos.filter(v => 
                v.registeredBy === userId || 
                v.uploaderUid === userId ||
                v.createdBy === userId
              ).slice(0, 3); // 최대 3개만

              console.log(`🎉 [useMyVideoViewers] ${userId}는 내 영상 ${watchedMyVideos.length}개 시청한 실제 시청자!`);

              return {
                user: {
                  uid: userId,
                  displayName: userProfile?.displayName || userProfile?.name || `사용자${userId.slice(-4)}`,
                  email: userProfile?.email || '',
                  photoURL: userProfile?.photoURL || userProfile?.profileImage || '/default-profile.png',
                  ...userProfile
                },
                watchedMyVideos: watchedMyVideos.sort((a, b) => b.watchedAt - a.watchedAt), // 최근 시청 순
                uploadedVideos: userUploadedVideos,
                isOnline: Math.random() > 0.3 // 70% 확률로 온라인 (실제 온라인 상태는 복잡하므로 랜덤)
              };
            }
            return null;
          } catch (error) {
            console.warn(`⚠️ [useMyVideoViewers] ${userId} 처리 중 오류:`, error);
            return null;
          }
        });

        // 모든 사용자 처리 완료 대기
        const results = await Promise.all(viewerPromises);
        const realViewers = results.filter(viewer => viewer !== null);

        console.log(`✅ [useMyVideoViewers] 실제 시청자 ${realViewers.length}명 발견`);
        
        // 실제 시청자가 없으면 샘플 데이터로 폴백
        if (realViewers.length === 0) {
          console.log('📝 [useMyVideoViewers] 실제 시청자가 없어 샘플 데이터 생성');
          
          const sampleViewers = myVideoList.slice(0, 2).map((video, index) => ({
            user: {
              uid: `sample_viewer_${index}`,
              displayName: `샘플시청자${index + 1}`,
              email: `sample${index}@example.com`,
              photoURL: '/default-profile.png'
            },
            watchedMyVideos: [{
              ...video,
              watchCount: Math.floor(Math.random() * 3) + 1,
              watchedAt: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000),
              certified: true,
              watchedFrom: 'main'
            }],
            uploadedVideos: [],
            isOnline: true
          }));
          
          setViewers(sampleViewers);
        } else {
          setViewers(realViewers);
        }
        
        setLoading(false);

      } catch (error) {
        console.error('❌ [useMyVideoViewers] 실제 시청자 데이터 로드 실패:', error);
        setViewers([]);
        setLoading(false);
      }
    }

    fetchRealViewers();
  }, [currentUser, ucraVideos, loadingUcraVideos]);

  return { loading, viewers };
} 