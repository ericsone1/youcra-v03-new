import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useUcraVideos } from './useUcraVideos';
import { getMultipleVideoStats } from '../../../services/videoStatsService';

/**
 * 내가 등록한 영상의 실제 시청자들을 가져오는 훅 (최적화 버전)
 */
export function useMyVideoViewers() {
  console.log('🚀 [useMyVideoViewers] 훅 시작');
  
  const { currentUser } = useAuth();
  const { ucraVideos, loading: loadingUcraVideos } = useUcraVideos();
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);



  console.log('📊 [useMyVideoViewers] 초기 상태:', {
    hasCurrentUser: !!currentUser,
    currentUserUid: currentUser?.uid,
    loadingUcraVideos,
    isInitialized,
    ucraVideosLength: ucraVideos.length
  });

  useEffect(() => {
    console.log('🔄 [useMyVideoViewers] useEffect 실행');
    console.log('🔍 [useMyVideoViewers] 조건 확인:', {
      hasCurrentUser: !!currentUser,
      currentUserUid: currentUser?.uid,
      loadingUcraVideos,
      isInitialized,
      ucraVideosLength: ucraVideos.length
    });

    if (!currentUser) {
      console.log('❌ [useMyVideoViewers] 현재 사용자 없음 - 실행 중단');
      return;
    }

    if (loadingUcraVideos) {
      console.log('⏳ [useMyVideoViewers] ucraVideos 로딩 중 - 실행 중단');
      return;
    }

    // 🚨 임시로 초기화 상태 무시하고 항상 실행
    console.log('✅ [useMyVideoViewers] 모든 조건 통과 - 실행 시작 (초기화 상태 무시)');

    async function fetchViewersFromStats() {
      try {
        setLoading(true);
        console.log('🚀 [useMyVideoViewers] 시청자 데이터 로드 시작');
        
        // 내가 등록한 영상들 찾기
        const myVideoList = ucraVideos.filter(v => {
          const isMyVideo = v.registeredBy === currentUser.uid || 
                            v.uploaderUid === currentUser.uid ||
                            v.createdBy === currentUser.uid ||
                            v.channelId === currentUser.channelId ||
                            v.authorId === currentUser.uid ||
                            v.uploader === currentUser.displayName ||
                            v.channel === currentUser.displayName ||
                            v.registeredByEmail === currentUser.email ||
                            v.registeredByUid === currentUser.uid;
          
          if (isMyVideo) {
            console.log('✅ [useMyVideoViewers] 내 영상 발견:', {
              title: v.title?.substring(0, 30),
              videoId: v.videoId || v.id,
              registeredBy: v.registeredBy,
              uploaderUid: v.uploaderUid,
              currentUserUid: currentUser.uid
            });
          }
          
          return isMyVideo;
        });
        
        console.log('👤 [useMyVideoViewers] 내가 등록한 영상 수:', myVideoList.length);
        console.log('👤 [useMyVideoViewers] 현재 사용자 UID:', currentUser.uid);
        
        if (myVideoList.length === 0) {
          console.log('📭 [useMyVideoViewers] 등록한 영상이 없음');
          setViewers([]);
          setLoading(false);
          setIsInitialized(true);
          return;
        }

        const myVideoIds = myVideoList.map(v => {
          // 다양한 필드에서 videoId 추출 시도
          const videoId = v.videoId || v.id || v.youtubeId || v.youtube_id || v.video_id;
          console.log('🎯 [useMyVideoViewers] 영상 ID 추출:', {
            title: v.title?.substring(0, 20),
            videoId,
            originalFields: {
              videoId: v.videoId,
              id: v.id,
              youtubeId: v.youtubeId,
              youtube_id: v.youtube_id,
              video_id: v.video_id
            }
          });
          return videoId;
        }).filter(id => id); // null/undefined 제거
        console.log('🎯 [useMyVideoViewers] 내 영상 IDs:', myVideoIds);
        
        // 집계 컬렉션에서 내 영상의 통계 조회
        const statsMap = await getMultipleVideoStats(myVideoIds);
        console.log('📊 [useMyVideoViewers] 집계 통계 결과:', Object.keys(statsMap).length, '개');
        
        // 시청자가 있는 영상들만 필터링
        const videosWithViewers = Object.entries(statsMap)
          .filter(([videoId, stats]) => stats.totalViews > 0)
          .map(([videoId, stats]) => {
            const video = myVideoList.find(v => (v.videoId || v.id) === videoId);
            return {
              video,
              stats,
              viewers: stats.viewers || []
            };
          });

        console.log('👥 [useMyVideoViewers] 시청자가 있는 영상 수:', videosWithViewers.length);

        if (videosWithViewers.length === 0) {
          console.log('📭 [useMyVideoViewers] 시청자가 있는 영상이 없음');
          setViewers([]);
          setLoading(false);
          setIsInitialized(true);
          return;
        }

        // 시청자 정보 수집
        const viewerIds = new Set();
        videosWithViewers.forEach(({ viewers }) => {
          viewers.forEach(viewerId => {
            if (viewerId !== currentUser.uid) {
              viewerIds.add(viewerId);
            }
          });
        });

        console.log('👥 [useMyVideoViewers] 고유 시청자 수:', viewerIds.size);
        console.log('👥 [useMyVideoViewers] 시청자 IDs:', Array.from(viewerIds));

        // 시청자 프로필 정보 조회
        const viewerProfiles = [];
        for (const viewerId of viewerIds) {
          try {
            // 사용자 문서 직접 조회
            const userDocRef = doc(db, 'users', viewerId);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              viewerProfiles.push({
                uid: viewerId,
                displayName: userData?.displayName || userData?.name || `사용자${viewerId.slice(-4)}`,
                email: userData?.email || '',
                photoURL: userData?.photoURL || userData?.profileImage || '/default-profile.png',
                ...userData
              });
              console.log(`✅ [useMyVideoViewers] 시청자 ${viewerId} 프로필 조회 성공:`, userData?.displayName || userData?.name);
            } else {
              console.warn(`⚠️ [useMyVideoViewers] 시청자 ${viewerId} 문서가 존재하지 않음`);
            }
          } catch (error) {
            console.warn(`⚠️ [useMyVideoViewers] 시청자 ${viewerId} 프로필 조회 실패:`, error);
          }
        }

        console.log('👤 [useMyVideoViewers] 시청자 프로필 수:', viewerProfiles.length);

        // 시청자별 시청 영상 정보 구성
        const viewersWithDetails = await Promise.all(viewerProfiles.map(async viewer => {
          console.log(`\n🔍 [useMyVideoViewers] 시청자 ${viewer.displayName} (${viewer.uid}) 처리 시작`);
          
          const watchedMyVideos = videosWithViewers
            .filter(({ viewers }) => viewers.includes(viewer.uid))
            .map(({ video, stats }) => ({
              ...video,
              watchCount: stats.totalViews,
              watchedAt: stats.lastUpdated?.toMillis?.() || Date.now(),
              certified: true,
              watchedFrom: 'main'
            }))
            .sort((a, b) => b.watchedAt - a.watchedAt);
            
          console.log(`📺 [useMyVideoViewers] ${viewer.displayName}이 본 내 영상 수:`, watchedMyVideos.length);

          return {
            user: viewer,
            watchedMyVideos,
            isOnline: Math.random() > 0.3
          };
        }));

        console.log('✅ [useMyVideoViewers] 최종 시청자 수:', viewersWithDetails.length);
        setViewers(viewersWithDetails);
        setLoading(false);
        setIsInitialized(true);

      } catch (error) {
        console.error('❌ [useMyVideoViewers] 시청자 데이터 로드 실패:', error);
        setViewers([]);
        setLoading(false);
        setIsInitialized(true);
      }
    }

    fetchViewersFromStats();
  }, [currentUser, ucraVideos, loadingUcraVideos, isInitialized]);

  // 강제 새로고침 함수
  const refreshViewers = () => {
    setIsInitialized(false);
    setLoading(true);
  };

  return { loading, viewers, refreshViewers };
} 