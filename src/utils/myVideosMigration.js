import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// 기존 myVideos에 registeredAt 추가하는 migration 함수
export const migrateMyVideos = async () => {
  console.log('🔄 [Migration] myVideos registeredAt 추가 시작...');
  
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let processedCount = 0;
    let updatedCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      if (userData.myVideos && Array.isArray(userData.myVideos)) {
        let needsUpdate = false;
        const now = new Date();
        
        const updatedMyVideos = userData.myVideos.map(video => {
          if (!video.registeredAt) {
            needsUpdate = true;
            return {
              ...video,
              registeredAt: {
                seconds: Math.floor(now.getTime() / 1000),
                nanoseconds: (now.getTime() % 1000) * 1000000
              }
            };
          }
          return video;
        });
        
        if (needsUpdate) {
          await updateDoc(doc(db, 'users', userDoc.id), {
            myVideos: updatedMyVideos
          });
          updatedCount++;
          console.log(`✅ [Migration] ${userDoc.id} - myVideos 업데이트 완료 (${userData.myVideos.length}개)`);
        }
      }
      
      processedCount++;
    }
    
    console.log(`🎉 [Migration] 완료 - 처리: ${processedCount}, 업데이트: ${updatedCount}`);
    return { processedCount, updatedCount };
    
  } catch (error) {
    console.error('❌ [Migration] 실패:', error);
    throw error;
  }
};

// 개발환경에서만 전역으로 사용 가능하도록 설정
if (process.env.NODE_ENV === 'development') {
  window.migrateMyVideos = migrateMyVideos;
} 