import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 기존에 등록된 영상들을 사용자의 myVideos 컬렉션에 마이그레이션하는 함수
 */
export const migrateExistingVideos = async () => {
  console.log('🔄 [Migration] 기존 영상들을 myVideos 컬렉션에 마이그레이션 시작...');
  
  try {
    // 1. 루트 videos 컬렉션에서 모든 영상 가져오기
    const videosSnapshot = await getDocs(collection(db, 'videos'));
    console.log(`📹 [Migration] 루트 videos 컬렉션에서 ${videosSnapshot.size}개 영상 발견`);
    
    let processedCount = 0;
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const videoDoc of videosSnapshot.docs) {
      const videoData = videoDoc.data();
      const registeredBy = videoData.registeredBy || videoData.uploaderUid || videoData.uploader;
      
      if (!registeredBy || registeredBy === 'anonymous') {
        console.log(`⚠️ [Migration] 영상 ${videoDoc.id} - 등록자 정보 없음, 건너뜀`);
        skippedCount++;
        continue;
      }
      
      try {
        // 2. 해당 사용자의 myVideos 컬렉션에 이미 존재하는지 확인
        const userMyVideosQuery = query(
          collection(db, 'users', registeredBy, 'myVideos'),
          where('videoId', '==', videoData.videoId)
        );
        const existingVideos = await getDocs(userMyVideosQuery);
        
        if (!existingVideos.empty) {
          console.log(`✅ [Migration] 영상 ${videoData.videoId} - 이미 myVideos에 존재함, 건너뜀`);
          skippedCount++;
          continue;
        }
        
        // 3. myVideos 컬렉션에 추가
        await addDoc(collection(db, 'users', registeredBy, 'myVideos'), {
          ...videoData,
          videoId: videoData.videoId,
          registeredBy: registeredBy,
          uploaderUid: registeredBy,
          registeredAt: videoData.registeredAt || serverTimestamp(),
          rootVideoId: videoDoc.id
        });
        
        console.log(`✅ [Migration] 영상 ${videoData.videoId} - ${registeredBy}의 myVideos에 추가됨`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ [Migration] 영상 ${videoDoc.id} 마이그레이션 실패:`, error);
        skippedCount++;
      }
      
      processedCount++;
    }
    
    console.log(`🎉 [Migration] 완료 - 처리: ${processedCount}, 마이그레이션: ${migratedCount}, 건너뜀: ${skippedCount}`);
    return { processedCount, migratedCount, skippedCount };
    
  } catch (error) {
    console.error('❌ [Migration] 실패:', error);
    throw error;
  }
};

// 개발환경에서만 전역으로 사용 가능하도록 설정
if (process.env.NODE_ENV === 'development') {
  window.migrateExistingVideos = migrateExistingVideos;
} 