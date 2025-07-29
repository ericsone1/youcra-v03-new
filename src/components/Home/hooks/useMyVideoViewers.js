import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useUcraVideos } from './useUcraVideos';

/**
 * 내가 등록한 영상의 시청자들을 가져오는 훅 (샘플 데이터 기반)
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

    // 1초 후 로딩 완료
    const timer = setTimeout(() => {
      console.log('🔍 [useMyVideoViewers] 시청자 데이터 생성 시작');
      
      // 내가 등록한 영상들 찾기
      const myVideoList = ucraVideos.filter(
        v => v.registeredBy === currentUser.uid || 
             v.uploaderUid === currentUser.uid ||
             v.createdBy === currentUser.uid
      );
      
      console.log(`👤 [useMyVideoViewers] 내가 등록한 영상 수: ${myVideoList.length}`);
      
      if (myVideoList.length === 0) {
        console.log('📭 [useMyVideoViewers] 등록한 영상이 없어 시청자 없음');
        setViewers([]);
        setLoading(false);
        return;
      }

      // 내가 등록한 영상 기반으로 샘플 시청자 생성
      const sampleViewers = [];
      
      // 영상마다 1-3명의 시청자 생성
      myVideoList.forEach((video, videoIndex) => {
        const viewerCount = Math.min(3, Math.floor(Math.random() * 3) + 1);
        
        for (let i = 0; i < viewerCount; i++) {
          const viewerId = `viewer_${videoIndex}_${i}`;
          const names = ['김유튜버', '박크리에이터', '이시청자', '최팬', '정구독자', '한시청자'];
          const watchTimes = [900, 1800, 2400, 3600]; // 15분, 30분, 40분, 1시간
          
          sampleViewers.push({
            user: {
              uid: viewerId,
              displayName: names[Math.floor(Math.random() * names.length)] + (i + 1),
              email: `${viewerId}@example.com`,
              photoURL: `https://images.unsplash.com/photo-${535713875002 + videoIndex + i}-d1d0cf377fde?w=150&h=150&fit=crop&crop=face`
            },
            watchedMyVideos: [{
              ...video,
              watchCount: Math.floor(Math.random() * 5) + 1,
              watchedAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // 지난 일주일 내
              watchTime: watchTimes[Math.floor(Math.random() * watchTimes.length)],
              certified: Math.random() > 0.3 // 70% 확률로 인증
            }],
            uploadedVideos: [],
            isOnline: Math.random() > 0.5 // 50% 확률로 온라인
          });
        }
      });

      // 중복 제거 및 최대 10명으로 제한
      const uniqueViewers = sampleViewers
        .filter((viewer, index, self) => 
          index === self.findIndex(v => v.user.displayName === viewer.user.displayName)
        )
        .slice(0, 10);

      console.log(`✅ [useMyVideoViewers] 샘플 시청자 ${uniqueViewers.length}명 생성 완료`);
      setViewers(uniqueViewers);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentUser, ucraVideos, loadingUcraVideos]);

  return { loading, viewers };
} 