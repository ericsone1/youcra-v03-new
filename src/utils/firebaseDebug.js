import { db } from '../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc, limit } from 'firebase/firestore';

// Firebase에서 최신 등록 영상들 조회
export const checkLatestVideos = async () => {
  console.log('🔍 [Firebase Debug] 최신 등록 영상 조회 시작...');
  
  try {
    // 1. 루트 videos 컬렉션에서 최신 영상 조회
    console.log('📁 [루트 videos] 조회 중...');
    const videosRef = collection(db, 'videos');
    const videosQuery = query(videosRef, orderBy('registeredAt', 'desc'), limit(5));
    const videosSnapshot = await getDocs(videosQuery);
    
    console.log('📊 [루트 videos] 최신 5개:', videosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        registeredAt: data.registeredAt?.toDate?.()?.toLocaleString() || data.registeredAt,
        videoId: data.videoId
      };
    }));

    // 2. 채팅방별 videos 조회
    console.log('📁 [채팅방 videos] 조회 중...');
    const chatRoomsRef = collection(db, 'chatRooms');
    const chatRoomsSnapshot = await getDocs(chatRoomsRef);
    
    const allChatVideos = [];
    
    for (const roomDoc of chatRoomsSnapshot.docs) {
      const roomData = roomDoc.data();
      const videosRef = collection(db, 'chatRooms', roomDoc.id, 'videos');
      const videosQuery = query(videosRef, orderBy('registeredAt', 'desc'), limit(3));
      const videosSnapshot = await getDocs(videosQuery);
      
      videosSnapshot.docs.forEach(videoDoc => {
        const data = videoDoc.data();
        allChatVideos.push({
          id: videoDoc.id,
          title: data.title,
          registeredAt: data.registeredAt?.toDate?.()?.toLocaleString() || data.registeredAt,
          videoId: data.videoId,
          roomName: roomData.name || roomDoc.id,
          roomId: roomDoc.id
        });
      });
    }
    
    // 채팅방 비디오들을 등록일 기준으로 정렬
    allChatVideos.sort((a, b) => {
      const aTime = new Date(a.registeredAt).getTime();
      const bTime = new Date(b.registeredAt).getTime();
      return bTime - aTime;
    });
    
    console.log('📊 [채팅방 videos] 최신 10개:', allChatVideos.slice(0, 10));

    // 3. 사용자 myVideos 조회
    console.log('📁 [사용자 myVideos] 조회 중...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const allMyVideos = [];
    
    usersSnapshot.docs.forEach(userDoc => {
      const userData = userDoc.data();
      if (Array.isArray(userData.myVideos)) {
        userData.myVideos.forEach(video => {
          allMyVideos.push({
            title: video.title,
            registeredAt: video.registeredAt || video.publishedAt || '등록일 없음',
            videoId: video.videoId || video.id,
            userUid: userDoc.id
          });
        });
      }
    });
    
    console.log('📊 [사용자 myVideos] 총 개수:', allMyVideos.length);
    console.log('📊 [사용자 myVideos] 샘플 5개:', allMyVideos.slice(0, 5));

    // 4. 전체 최신 영상 통합 분석
    const allVideos = [
      ...videosSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          source: '루트',
          title: data.title,
          registeredAt: data.registeredAt?.toDate?.()?.toLocaleString() || data.registeredAt,
          videoId: data.videoId
        };
      }),
      ...allChatVideos.slice(0, 10).map(video => ({
        source: `채팅방:${video.roomName}`,
        title: video.title,
        registeredAt: video.registeredAt,
        videoId: video.videoId
      }))
    ];

    // 등록일 기준으로 정렬
    allVideos.sort((a, b) => {
      const aTime = new Date(a.registeredAt).getTime();
      const bTime = new Date(b.registeredAt).getTime();
      return bTime - aTime;
    });

    console.log('🏆 [전체 최신 영상] TOP 10:', allVideos.slice(0, 10));

  } catch (error) {
    console.error('❌ [Firebase Debug] 오류:', error);
  }
};

// 개발환경에서만 전역으로 사용 가능하도록 설정
if (process.env.NODE_ENV === 'development') {
  window.checkLatestVideos = checkLatestVideos;
} 